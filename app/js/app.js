// Define global variables
let quote_id, account_id, prospect_id, prospect_number, account_jurisdiction, selectedFile;

function showCustomAlert(message) {
    const alertBox = document.getElementById("custom-alert");
    const alertMessage = alertBox.querySelector("p");
    alertMessage.textContent = message;
    alertBox.classList.remove("hidden");
}

function hideCustomAlert() {
    const alertBox = document.getElementById("custom-alert");
    alertBox.classList.add("hidden");
}

// On load of Quotes page
ZOHO.embeddedApp.on("PageLoad", async (entity) => {
    try {
        const entity_id = entity.EntityId[0];
        const quote_response = await ZOHO.CRM.API.getRecord({
            Entity: "Quotes", approved: "both", RecordID: entity_id
        });

        const quote_data = quote_response.data[0];
        quote_id = quote_data.id;
        prospect_id = quote_data.Deal_Name.id;
        account_id = quote_data.Account_Name.id;

        const account_response = await ZOHO.CRM.API.getRecord({
            Entity: "Accounts", approved: "both", RecordID: account_id
        });

        const account_data = account_response.data[0];
        const contact_id = account_data.Primary_Contact.id;
        const primary_email = account_data.PC_Email;
        
        account_jurisdiction = account_data.Jurisdiction;

        const contact_response = await ZOHO.CRM.API.getRecord({
            Entity: "Contacts", approved: "both", RecordID: contact_id
        });

        const contact_data = contact_response.data[0];
  

        const deals_response = await ZOHO.CRM.API.getRecord({
            Entity: "Deals", approved: "both", RecordID: prospect_id
        });

        const deals_data = deals_response.data[0];
        prospect_number = deals_data.Deal_Control_Number;

    } catch (error) {
        console.error("Error fetching data:", error);
    }
});

function create_record(event) {
    event.preventDefault();

    const record_data = {
        "Account_Name": account_id,
        "Deal_Name": prospect_id,
        "Type": "Others",
        "License_Remarks": prospect_number + " - Physical company self-ink stamp.",
        "Status": "Completed",
        "License_Jurisdiction": account_jurisdiction
    };

    ZOHO.CRM.API.insertRecord({
        Entity: "Applications1",
        APIData: record_data
        // Trigger: []
    }).then((response) => {
        const applicationData = response.data;
        applicationData.forEach((record) => {
            const application_id = record.details.id;

            if (selectedFile) {
                const blob = new Blob([selectedFile], { type: selectedFile.type });

                const fileData = {
                    Name: selectedFile.name,
                    Content: blob
                };

                ZOHO.CRM.API.attachFile({
                    Entity: "Applications1",
                    RecordID: application_id,
                    File: fileData
                }).then((attachmentResponse) => {
                    console.log("Attachment uploaded successfully:", attachmentResponse);
                }).catch((error) => {
                    console.error("Error uploading attachment:", error);
                });
            }

            const application_url = "https://crm.zoho.com/crm/org682300086/tab/CustomModule3/" + application_id;
            window.open(application_url, '_blank').focus();

            document.getElementById("record-created-alert").classList.remove("hidden");
        });
    }).catch((error) => {
        console.error("Error creating record:", error);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const dropZone = document.getElementById("drop-zone");
    const fileInput = document.getElementById("imageUploader");
    const submitButton = document.getElementById("submit_button_id");
    const alertOkButton = document.getElementById("alert-ok-button");

    const validTypes = ["image/png", "image/jpeg", "image/jpg"];

    function handleFile(file) {
        if (!file || !validTypes.includes(file.type)) {
            showCustomAlert("Please make sure the image is in PNG, JPG, or JPEG format.");
            return;
        }

        if (file.size > 20 * 1024 * 1024) {
            showCustomAlert("File size must be 20MB or less.");
            return;
        }

        selectedFile = file;
        console.log("Valid image file selected:", file.name);
    }

    // Handle input change
    fileInput.addEventListener("change", () => {
        if (fileInput.files.length > 0) {
            handleFile(fileInput.files[0]);
        }
    });

    let dropZoneClicked = false;

    document.addEventListener("DOMContentLoaded", function () {
        if (!dropZoneClicked) {
            dropZoneClicked = true;
    
            dropZone.addEventListener("click", () => {
                fileInput.click();
                return;
            });
        }
    });

    dropZone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropZone.classList.add("dragover");
    });

    dropZone.addEventListener("dragleave", () => {
        dropZone.classList.remove("dragover");
    });

    dropZone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropZone.classList.remove("dragover");
        const file = e.dataTransfer.files[0];
        if (file) {
            fileInput.files = e.dataTransfer.files;
            handleFile(file);
        }
    });

    submitButton.addEventListener("click", function (event) {
        if (!selectedFile) {
            showCustomAlert("Please upload an image in PNG, JPG, or JPEG format.");
            return;
        }
        create_record(event);
    });

    alertOkButton.addEventListener("click", function () {
        hideCustomAlert();
        fileInput.value = "";
        selectedFile = null;
    });
});

ZOHO.embeddedApp.init();
