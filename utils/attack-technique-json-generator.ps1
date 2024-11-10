# Define input file paths
$attackTechniquesCsvPath = "consolidated-attack-techniques.csv"
$attackRelationshipsCsvPath = "consolidated-attack-relationships.csv"
$nistMappingJsonPath = "800-53-to-attack.json"
$cisControlsCsvPath = "cis-controls-to-techniques.csv"
$prevalenceCsvPath = "consolidated-attack-prev-tid.csv"
$assetTypesCsvPath = "techniques-to-asset-types.csv"
$outputFilePath = "attack_techniques_output.json"

# Function to calculate median
function Get-Median {
    param(
        [Parameter(Mandatory = $true)]
        [float[]] $Values
    )
    $sortedValues = $Values | Sort-Object
    $count = $sortedValues.Count

    if ($count % 2 -eq 0) {
        return ($sortedValues[$count / 2 - 1] + $sortedValues[$count / 2]) / 2
    } else {
        return $sortedValues[([math]::Floor($count / 2))]
    }
}

try {
    # Import CSV and JSON data with logging
    Write-Host "Importing CSV and JSON data..." -Verbose
    $attackTechniquesData = Import-Csv -Path $attackTechniquesCsvPath
    $attackRelationshipsData = Import-Csv -Path $attackRelationshipsCsvPath
    $nistMappingData = (Get-Content -Path $nistMappingJsonPath | ConvertFrom-Json).mapping_objects
    $cisControlsData = Import-Csv -Path $cisControlsCsvPath
    $prevalenceData = Import-Csv -Path $prevalenceCsvPath
    $assetTypesData = Import-Csv -Path $assetTypesCsvPath
    Write-Host "Data import complete." -Verbose

    # Create dictionaries for faster lookups
    Write-Host "Creating lookup dictionaries..." -Verbose
    $relationshipsDict = @{ }
    foreach ($rel in $attackRelationshipsData) {
        if ($null -ne $rel."target ID") {
            if (-not $relationshipsDict.ContainsKey($rel."target ID")) {
                $relationshipsDict[$rel."target ID"] = @()
            }
            $relationshipsDict[$rel."target ID"] += $rel
        }
    }

    $nistControlsDict = @{ }
    foreach ($mapping in $nistMappingData) {
        if ($null -ne $mapping."attack_object_id") {
            if (-not $nistControlsDict.ContainsKey($mapping."attack_object_id")) {
                $nistControlsDict[$mapping."attack_object_id"] = @()
            }
            $nistControlsDict[$mapping."attack_object_id"] += $mapping."capability_id"
        }
    }

    $cisControlsDict = @{ }
    foreach ($control in $cisControlsData) {
        if ($null -ne $control."Combined ATT&CK (Sub-)Technique ID") {
            if (-not $cisControlsDict.ContainsKey($control."Combined ATT&CK (Sub-)Technique ID")) {
                $cisControlsDict[$control."Combined ATT&CK (Sub-)Technique ID"] = @()
            }
            $cisControlsDict[$control."Combined ATT&CK (Sub-)Technique ID"] += $control."CIS Safeguard"
        }
    }
    Write-Host "Lookup dictionaries created." -Verbose

    # Process each attack technique and create custom objects
    Write-Host "Processing attack techniques..." -Verbose
    $jsonObjects = @()
    foreach ($technique in $attackTechniquesData) {
        try {
            $attackTechniqueId = $technique."ID"

            if ($null -eq $attackTechniqueId) {
                Write-Warning "Skipping technique with null Technique ID."
                continue
            }

            # Create custom object for each attack technique
            $attackTechniqueObject = [PSCustomObject]@{
                attack_technique_id           = $attackTechniqueId
                matrix                        = $technique."matrices"
                attack_technique_name         = $technique."name"
                #attack_technique_description  = $technique."description".Trim()
                attack_technique_domain       = $technique."domain"
                attack_technique_tactics      = $technique."tactics" -split "," | ForEach-Object { $_.Trim() }
                #attack_technique_detection    = $technique."detection"
                attack_technique_platforms    = $technique."platforms" -split "," | ForEach-Object { $_.Trim() }
                attack_technique_data_sources = $technique."data sources" -split "," | ForEach-Object { $_.Trim() }
                attack_technique_mitigations  = if ($relationshipsDict.ContainsKey($attackTechniqueId)) {
                                                  $relationshipsDict[$attackTechniqueId] |
                                                  Where-Object { $_."mapping type" -eq 'mitigates' } |
                                                  Select-Object -ExpandProperty "source ID" -Unique
                                              } else {
                                                  @()
                                              }
                attack_technique_detections   = if ($relationshipsDict.ContainsKey($attackTechniqueId)) {
                                                  $relationshipsDict[$attackTechniqueId] |
                                                  Where-Object { $_."mapping type" -eq 'detects' } |
                                                  Select-Object -ExpandProperty "source name" -Unique
                                              } else {
                                                  @()
                                              }
                attack_technique_controls     = [PSCustomObject]@{
                                                  nist_controls = if ($nistControlsDict.ContainsKey($attackTechniqueId)) {
                                                                      $nistControlsDict[$attackTechniqueId] |
                                                                      Sort-Object -Unique
                                                                  } else {
                                                                      @()
                                                                  }
                                                  cis_controls  = if ($cisControlsDict.ContainsKey($attackTechniqueId)) {
                                                                      $cisControlsDict[$attackTechniqueId] |
                                                                      Sort-Object -Unique
                                                                  } else {
                                                                      @()
                                                                  }
                                              }
                attack_technique_prevalence   = if ($prevalenceData."Technique (ID)" -contains $attackTechniqueId) {
                                                  [float]($prevalenceData |
                                                  Where-Object { $_."Technique (ID)" -eq $attackTechniqueId } |
                                                  Select-Object -ExpandProperty "Prevalence Scores")
                                              } else {
                                                  Get-Median -Values ($prevalenceData."Prevalence Scores" | ForEach-Object {[float]$_})
                                              }
                attack_technique_tid_before   = if ($prevalenceData."Technique (ID)" -contains $attackTechniqueId) {
                                                  [int]($prevalenceData |
                                                  Where-Object { $_."Technique (ID)" -eq $attackTechniqueId } |
                                                  Select-Object -ExpandProperty "Num. TID Before")
                                              } else {
                                                  [math]::Round((Get-Median -Values ($prevalenceData."Num. TID Before" | ForEach-Object {[int]$_})))
                                              }
                attack_technique_tid_after    = if ($prevalenceData."Technique (ID)" -contains $attackTechniqueId) {
                                                  [int]($prevalenceData |
                                                  Where-Object { $_."Technique (ID)" -eq $attackTechniqueId } |
                                                  Select-Object -ExpandProperty "Num. TID After")
                                              } else {
                                                  [math]::Round((Get-Median -Values ($prevalenceData."Num. TID After" | ForEach-Object {[int]$_})))
                                              }
                
                # Determine affected asset types based on the matrix type
                attack_technique_affected_asset_types = switch -Regex ($technique.matrices) {
                                                                                                "^enterprise$" {
                                                                                                    ($assetTypesData |
                                                                                                    Where-Object { $_."ID" -eq $attackTechniqueId } |
                                                                                                    Select-Object -ExpandProperty "affected asset types" |
                                                                                                    Where-Object { $_ }) -split "," | ForEach-Object { $_.Trim() }
                                                                                                 }
                                                                                                "ics" {
                                                                                                    @("OT Device", "Network Appliance", "IOT Device", "Router")
                                                                                                }
                                                                                                "mobile" {
                                                                                                    @("Mobile Device iOS", "Mobile Device Android")
                                                                                                }
                                                                                                default {
                                                                                                    @()
                                                                                                }
                                                                                            }
            }

            # Add the attack technique object to the array
            $jsonObjects += $attackTechniqueObject

            # Write progress
            Write-Progress -Activity "Processing Techniques" -Status "Processing $attackTechniqueId" -PercentComplete (($jsonObjects.Count / $attackTechniquesData.Count) * 100)

        } catch {
            Write-Error "An error occurred while processing technique ID $($technique."ID"): $_"
        }
    }
    Write-Host "Attack techniques processed." -Verbose

    # Convert the array of objects to JSON and save to file
    Write-Host "Converting to JSON and saving to file..." -Verbose
    $jsonOutput = $jsonObjects | ConvertTo-Json -Depth 5
    Set-Content -Path $outputFilePath -Value $jsonOutput
    Write-Host "JSON file generated successfully: $outputFilePath" -Verbose

} catch {
    Write-Error "Failed to generate JSON file: $_"
    exit 1
}
