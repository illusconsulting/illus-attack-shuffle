# Define the file paths for the input CSV and output JSON
$csvFilePath = "C:\Users\shove\OneDrive\Documents\GitHub\illus-attack-shuffle\remove\techniques-to-asset-types.csv"
$jsonFilePath = "C:\Users\shove\OneDrive\Documents\GitHub\illus-attack-shuffle\data\techniques-to-asset-types.json"
$assetTypesJsonFilePath = "C:\Users\shove\OneDrive\Documents\GitHub\illus-attack-shuffle\data\techniques-by-asset-types.json"

# Import the CSV file
$data = Import-Csv -Path $csvFilePath

# Prepare a hashtable to store data with ID as the key
$jsonOutput = @{}
# Prepare a dictionary to store affected asset types with an array of associated IDs
$assetTypeDict = @{}

# Function to clean empty values from arrays and set empty arrays to $null
function CleanValue {
    param ($value)
    if ($value -is [Array]) {
        $filtered = $value | Where-Object { $_ -ne "" }  # Remove empty strings
        if ($filtered.Count -eq 0) { 
            return $null 
        } else { 
            return $filtered 
        }
    }
    if ($value -eq "") { 
        return $null 
    } else { 
        return $value 
    }
}

# Process each row
foreach ($row in $data) {
    # Convert specified columns to arrays by splitting on commas and trimming whitespace
    $tactics = CleanValue($row.tactics -split ",\s*")
    $platforms = CleanValue($row.platforms -split ",\s*")
    $dataSources = CleanValue($row.'data sources' -split ",\s*")
    $defensesBypassed = CleanValue($row.'defenses bypassed' -split ",\s*")
    $permissionsRequired = CleanValue($row.'permissions required' -split ",\s*")
    $effectivePermissions = CleanValue($row.'effective permissions' -split ",\s*")
    $affectedAssetTypes = CleanValue($row.'affected asset types' -split ",\s*")

    # Create an object with properties for each column, converting where necessary
    $jsonOutput[$row.ID] = @{
        "name" = CleanValue($row.name)
        "domain" = CleanValue($row.domain)
        "tactics" = $tactics
        "platforms" = $platforms
        "data sources" = $dataSources
        "is sub-technique" = CleanValue($row.'is sub-technique')
        "sub-technique of" = CleanValue($row.'sub-technique of')
        "defenses bypassed" = $defensesBypassed
        "permissions required" = $permissionsRequired
        "supports remote" = CleanValue($row.'supports remote')
        "system requirements" = CleanValue($row.'system requirements')
        "impact type" = CleanValue($row.'impact type')
        "effective permissions" = $effectivePermissions
        "affected asset types" = $affectedAssetTypes
    }

    # Populate assetTypeDict with affected asset types and their associated IDs
    foreach ($assetType in $affectedAssetTypes) {
        if ($assetType -ne $null) {  # Ensure asset type is not blank
            if (-not $assetTypeDict.ContainsKey($assetType)) {
                $assetTypeDict[$assetType] = @()
            }
            # Add the ID to the asset type array if it's not already present
            if ($assetTypeDict[$assetType] -notcontains $row.ID) {
                $assetTypeDict[$assetType] += $row.ID
            }
        }
    }
}

# Convert the main data to JSON and save to the first JSON file
$jsonOutputArray = $jsonOutput.GetEnumerator() | ForEach-Object { [PSCustomObject]@{ $_.Key = $_.Value } }
$jsonOutputArray | ConvertTo-Json -Depth 5 | Out-File -FilePath $jsonFilePath -Encoding utf8
Write-Output "CSV has been successfully converted to JSON with each ID as a key and saved to $jsonFilePath"

# Convert the asset type dictionary to a JSON array format and save to the second JSON file
$assetTypeJsonArray = @()
foreach ($assetType in $assetTypeDict.Keys) {
    $assetTypeJsonArray += @{ $assetType = $assetTypeDict[$assetType] }
}

$assetTypeJsonArray | ConvertTo-Json -Depth 5 | Out-File -FilePath $assetTypesJsonFilePath -Encoding utf8
Write-Output "Asset types JSON has been successfully generated and saved to $assetTypesJsonFilePath"

