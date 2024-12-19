// js/file_downloader.js

function downloadJsonFile(data, filename) {
    try {
        if (!data) {
            console.error("No data provided for download.");
            return;
        }
        const jsonData = JSON.stringify(data, null, 2); // Pretty print JSON with an indent of 2
        const blob = new Blob([jsonData], { type: 'application/json' });
        saveAs(blob, filename);
    } catch (error) {
        console.error("Error creating and downloading JSON file:", error);
    }
}

export { downloadJsonFile };