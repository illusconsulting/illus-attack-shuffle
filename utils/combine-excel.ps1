# Load required assemblies for Excel automation and Windows Forms dialogs
Add-Type -AssemblyName Microsoft.Office.Interop.Excel
Add-Type -AssemblyName System.Windows.Forms

# Define a function to select multiple files
function Select-Files {
    param(
        [string]$filter = "Excel Workbook (*.xlsx)|*.xlsx",
        [string]$title = "Select Excel Files"
    )
    $fileDialog = New-Object System.Windows.Forms.OpenFileDialog
    $fileDialog.Filter = $filter
    $fileDialog.Title = $title
    $fileDialog.Multiselect = $true

    if ($fileDialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        return $fileDialog.FileNames
    } else {
        return @()
    }
}

# Define a function to select a save file location
function Select-SaveFile {
    param(
        [string]$filter = "Excel Workbook (*.xlsx)|*.xlsx",
        [string]$title = "Save Excel File As"
    )
    $fileDialog = New-Object System.Windows.Forms.SaveFileDialog
    $fileDialog.Filter = $filter
    $fileDialog.Title = $title

    if ($fileDialog.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) {
        return $fileDialog.FileName
    } else {
        return $null
    }
}

# Prompt the user to select the save location for the new consolidated workbook
$savePath = Select-SaveFile
if (!$savePath) {
    Write-Output "No file selected for saving. Exiting script."
    exit
}

# Initialize log file as soon as script launches
$logFilePath = [System.IO.Path]::Combine([System.IO.Path]::GetDirectoryName($savePath), "Consolidation_Log.txt")
New-Item -Path $logFilePath -ItemType File -Force | Out-Null

# Define function for logging to log file and verbose output
function Write-Log ($message) {
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "$timestamp - $message"
    Add-Content -Path $logFilePath -Value $logEntry
    Write-Verbose -Message $logEntry -Verbose
}

# Initialize Excel application and create new workbook, saving it immediately
$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$newWorkbook = $excel.Workbooks.Add()
$newWorkbook.SaveAs($savePath)
Write-Log "New Excel workbook created and saved at $savePath."

# Prompt the user to select source Excel files (up to 10)
$filePaths = Select-Files
if ($filePaths.Count -eq 0) {
    Write-Log "No files selected. Exiting script."
    exit
} elseif ($filePaths.Count -gt 10) {
    Write-Log "Only up to 10 files can be processed. Exiting script."
    exit
}

# Initialize progress variables
$startTime = Get-Date
$rowCount = 0

# Process each selected Excel file
try {
    foreach ($filePath in $filePaths) {
        Write-Log "Processing file: $filePath"
        $sourceWorkbook = $excel.Workbooks.Open($filePath)
        $fileName = [System.IO.Path]::GetFileNameWithoutExtension($filePath)

        # Loop through each sheet in the source workbook
        foreach ($sheet in $sourceWorkbook.Sheets) {
            $sheetName = $sheet.Name

            # Check if the sheet exists in the new workbook, if not, add it
            $newSheet = $null
            try {
                $newSheet = $newWorkbook.Sheets.Item($sheetName)
            } catch {
                $newSheet = $newWorkbook.Sheets.Add()
                $newSheet.Name = $sheetName
                Write-Log "Sheet '$sheetName' created in new workbook."
            }

            # Copy data from source sheet to new sheet
            $usedRange = $sheet.UsedRange
            $columns = $usedRange.Columns.Count
            $rows = $usedRange.Rows.Count

            # Add a "matrices" header if it's the first row
            if ($newSheet.UsedRange.Rows.Count -eq 1) {
                $newSheet.Cells.Item(1, $columns + 1).Value2 = "matrices"
            }

            # Append each row to the new sheet as it is processed
            for ($row = 2; $row -le $rows; $row++) {
                $dataRow = @()
                for ($col = 1; $col -le $columns; $col++) {
                    $dataRow += $sheet.Cells.Item($row, $col).Value2
                }
                $dataRow += $fileName # Add filename as 'matrices' column
                $newRowIndex = $newSheet.UsedRange.Rows.Count + 1
                for ($col = 1; $col -le $dataRow.Count; $col++) {
                    $newSheet.Cells.Item($newRowIndex, $col).Value2 = $dataRow[$col - 1]
                }
                $rowCount++

                # Save the workbook after each row is appended
                $newWorkbook.Save()
            }

            Write-Log "Sheet '$sheetName' from file '$fileName' processed."
        }
        $sourceWorkbook.Close($false)
    }

    Write-Log "Consolidation complete. Total rows processed: $rowCount"
}
catch {
    Write-Log "Error: $($_.Exception.Message)"
}
finally {
    $newWorkbook.Close($true)
    $excel.Quit()
    Write-Log "Total time elapsed: $((Get-Date) - $startTime)"
}
