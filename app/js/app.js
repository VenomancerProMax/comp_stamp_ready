// Define global variables
let quote_id, account_id, prospect_id, primary_contact_name, contact_email, prospect_number, account_jurisdiction, selectedFile;

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
        const account_name = quote_data.Account_Name.name;

        // Fetch Account data
        const account_response = await ZOHO.CRM.API.getRecord({
            Entity: "Accounts", approved: "both", RecordID: account_id
        });

        const account_data = account_response.data[0];
        const contact_id = account_data.Primary_Contact.id;
        const primary_email = account_data.PC_Email;
        primary_contact_name = account_data.Primary_Contact_Name;
        account_jurisdiction = account_data.Jurisdiction;

        // Fetch Contact data
        const contact_response = await ZOHO.CRM.API.getRecord({
            Entity: "Contacts", approved: "both", RecordID: contact_id
        });

        const contact_data = contact_response.data[0];
        contact_email = contact_data.Email;

        // Fetch Deal/Prospect data
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
        "Email": "support@tlz.ae",
        "PIC_Name": primary_contact_name,
        "Secondary_Email": contact_email,
        "License_Remarks": prospect_number + " - Physical company self-ink stamp.",
        "Status": "Completed",
        "License_Jurisdiction": account_jurisdiction
    };

    ZOHO.CRM.API.insertRecord({
        Entity: "Applications1",
        APIData: record_data
    }).then((response) => {
        const applicationData = response.data;
        applicationData.forEach((record) => {
            const application_id = record.details.id;
            const application_record = record.details;

            console.log("Application Record Successful:", application_record);
            console.log("Record created successfully:", application_id);

            // Upload file after record creation
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

            // Show success alert and hide okay button
            document.getElementById("record-created-alert").classList.remove("hidden");
        });
    }).catch((error) => {
        console.error("Error creating record:", error);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    const fileInput = document.getElementById("pngUploader");
    const submitButton = document.getElementById("submit_button_id");
    const alertOkButton = document.getElementById("alert-ok-button");

    submitButton.addEventListener("click", function (event) {
        const file = fileInput.files[0];

        if (!file || file.type !== "image/png") {
            showCustomAlert("Please make sure the image is in PNG format.");
            return;
        }

        // 20 MB
        if (file.size > 20 * 1024 * 1024) {
            showCustomAlert("File size must be 20MB or less.");
            return;
        }

        selectedFile = file; // Save file to use in create_record
        console.log("Valid PNG file selected:", file.name);
        create_record(event);
    });

    alertOkButton.addEventListener("click", function () {
        hideCustomAlert();
        document.getElementById("pngUploader").value = "";
    });
});

ZOHO.embeddedApp.init();
