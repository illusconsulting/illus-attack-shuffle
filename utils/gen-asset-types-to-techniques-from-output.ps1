# Define the path to the input JSON file
$jsonInputPath = "attack_techniques_output.json"

# Import the JSON data
try {
    $attackTechniquesData = Get-Content -Path $jsonInputPath | ConvertFrom-Json
} catch {
    Write-Error "Failed to import JSON data: $_"
    exit 1
}

# Create a hashtable to store asset types and associated technique IDs
$assetTypesToTechniques = @{}

# Iterate over each attack technique and populate the hashtable
foreach ($technique in $attackTechniquesData) {
    $techniqueId = $technique.attack_technique_id
    $affectedAssetTypes = $technique.attack_technique_affected_asset_types

    foreach ($assetType in $affectedAssetTypes) {
        # If the asset type is not already in the hashtable, add it with an empty array
        if (-not $assetTypesToTechniques.ContainsKey($assetType)) {
            $assetTypesToTechniques[$assetType] = @()
        }
        
        # Add the technique ID to the asset type's array
        $assetTypesToTechniques[$assetType] += $techniqueId
    }
}

# Convert the hashtable to an array of PSCustomObjects for better output formatting
$assetTypeArray = @()
foreach ($key in $assetTypesToTechniques.Keys) {
    $assetTypeArray += [PSCustomObject]@{
        AssetType = $key
        TechniqueIDs = $assetTypesToTechniques[$key] | Sort-Object -Unique
    }
}

# Define the path to the output JSON file
$outputJsonPath = "asset_types_to_techniques_output.json"

# Output the result to a JSON file
$assetTypeArray | ConvertTo-Json -Depth 5 | Set-Content -Path $outputJsonPath

Write-Host "JSON file generated successfully: $outputJsonPath"
