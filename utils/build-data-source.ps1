# Paths to the input files
$consolidatedAttackPath = "C:\Users\shove\OneDrive\Documents\GitHub\illus-attack-shuffle\remove\scriptsource\consolidated-attack.xlsx"
$cisControlsPath = "C:\Users\shove\OneDrive\Documents\GitHub\illus-attack-shuffle\remove\scriptsource\cis-controls-to-techniques.csv"
$nistPath = "C:\Users\shove\OneDrive\Documents\GitHub\illus-attack-shuffle\remove\scriptsource\800-53-to-attack.json"

# Path for output JSON file
$outputJsonPath = "C:\Users\shove\OneDrive\Documents\GitHub\illus-attack-shuffle\remove\scriptsource\output.json"

# Import necessary module for reading Excel files
Import-Module ImportExcel

# Load the CIS Controls CSV file
$cisData = Import-Csv -Path $cisControlsPath

# Load the NIST JSON data
$nistData = Get-Content -Path $nistPath | ConvertFrom-Json

# Load the Excel sheets from consolidated-attack.xlsx
$mitigationsData = Import-Excel -Path $consolidatedAttackPath -WorksheetName "mitigations"
$relationshipsData = Import-Excel -Path $consolidatedAttackPath -WorksheetName "relationships"
$techniquesData = Import-Excel -Path $consolidatedAttackPath -WorksheetName "techniques"

# Initialize arrays for each type of object
$cisSafeguards = @{}
$attackMitigations = @{}
$attackTechniques = @{}

# Process cis_safeguard objects
foreach ($row in $cisData) {
    # Generate the key in format "CIS-XX-YY"
    $cisControl = $row.'CIS Control'
    $cisSafeguardNum = $row.'CIS Safeguard'
    $key = "CIS-{0:D2}-{1:D2}" -f $cisControl, $cisSafeguardNum.Split(".")[1]

    # Populate cis_implementation_group array based on IG columns
    $implementationGroups = @()
    if ($row.IG1 -eq 'x') { $implementationGroups += 1 }
    if ($row.IG2 -eq 'x') { $implementationGroups += 2 }
    if ($row.IG3 -eq 'x') { $implementationGroups += 3 }

    # Add the cis_safeguard object
    $cisSafeguards[$key] = @{
        cis_safeguard_num = $cisSafeguardNum
        asset_category = $row.'Asset Type'
        security_function = $row.'Security Function'
        cis_safeguard_title = $row.'Title'
        attack_mitigation_id = @($row.'ATT&CK V8.2 Enterprise Mitigation ID') -split ",\s*"
        attack_technique_id = @($row.'Combined ATT&CK (Sub-)Technique ID') -split ",\s*"
        cis_implementation_group = $implementationGroups
    }
}

# Process attack_mitigations objects
foreach ($mitigation in $mitigationsData) {
    # Generate key in format "ATCK-MXXXX"
    $mitigationID = $mitigation.ID
    $key = "ATCK-{0}" -f $mitigationID

    # Find related techniques in relationshipsData
    $relatedTechniques = $relationshipsData | Where-Object { 
        $_.'mapping type' -eq 'mitigates' -and $_.'source ID' -eq $mitigationID 
    } | Select-Object -ExpandProperty 'target ID'

    # Convert related techniques to an array if not empty
    $attackTechniqueIds = if ($relatedTechniques.Count -gt 0) { $relatedTechniques } else { @() }

    # Add the attack_mitigation object
    $attackMitigations[$key] = @{
        attack_mitigation_id = $mitigationID
        attack_mitigation_matrix = $mitigation.matrices
        attack_technique_id = $attackTechniqueIds
    }
}

# Process attack_technique objects
foreach ($technique in $techniquesData) {
    # Generate key in format "ATCK-TXXXX" or "ATCK-TXXXX-YYY" if sub-technique
    $techniqueID = $technique.ID -replace '\.', '-'
    $key = "ATCK-{0}" -f $techniqueID

    # Find related mitigations in relationshipsData
    $relatedMitigations = $relationshipsData | Where-Object { 
        $_.'mapping type' -eq 'mitigates' -and $_.'target ID' -eq $technique.ID 
    } | Select-Object -ExpandProperty 'source ID'

    # Find related NIST control IDs in nistData
    $nistControls = $nistData.mapping_objects | Where-Object {
        $_.attack_object_id -eq $technique.ID
    } | Select-Object -ExpandProperty 'capability_id'

    # Find related CIS safeguards in cisData
    $relatedCISSafeguards = $cisData | Where-Object {
        $_.'Combined ATT&CK (Sub-)Technique ID' -match $technique.ID
    } | Select-Object -ExpandProperty 'CIS Safeguard'

    # Add the attack_technique object
    $attackTechniques[$key] = @{
        attack_technique_id = $technique.ID
        attack_technique_matrix = $technique.matrices
        attack_mitigation_id = $relatedMitigations
        nist_control_id = $nistControls
        cis_safeguard_id = $relatedCISSafeguards
    }
}

# Combine all objects into a single output
$outputJson = @{
    cis_safeguards = $cisSafeguards
    attack_mitigations = $attackMitigations
    attack_techniques = $attackTechniques
}

# Export to JSON file
$outputJson | ConvertTo-Json -Depth 10 | Out-File -FilePath $outputJsonPath -Encoding utf8
Write-Output "JSON data has been successfully saved to $outputJsonPath"

