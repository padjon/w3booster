/*const EWS = require('node-ews');
*/

export class MailService {
    private readonly ewsConfig = {
        username: process.env.MAIL_USERNAME || 'info@devsheep.de',
        password: process.env.MAIL_PASSWORD || '',
        host: process.env.MAIL_HOST || 'https://outlook.office365.com',
        auth: process.env.MAIL_AUTH || 'basic'
    };
    private ews = null;

    constructor() {
        //this.ews = new EWS(this.ewsConfig);
    }

    public sendMail(subject: string, value: string, receiver = 'info@devsheep.de') {
        /*
        const ewsFunction = 'CreateItem';
        const ewsArgs = {
            'attributes': {
                'MessageDisposition': 'SendAndSaveCopy'
            },
            'SavedItemFolderId': {
                'DistinguishedFolderId': {
                    'attributes': {
                        'Id': 'sentitems'
                    }
                }
            },
            'Items': {
                'Message': {
                    'ItemClass': 'IPM.Note',
                    'Subject': subject,
                    'Body': {
                        'attributes': {
                            'BodyType': 'Text'
                        },
                        '$value': value
                    },
                    'ToRecipients': {
                        'Mailbox': {
                            'EmailAddress': receiver
                        }
                    },
                    'IsRead': 'false'
                }
            }
        };
        return this.ews.run(ewsFunction, ewsArgs);*/
    }
}


/*GET FOLDERS
var ewsFunction = 'FindFolder';

let ewsArgs = {
    'attributes': {
        'Traversal': 'Shallow'
    },
    'FolderShape': {
        'BaseShape': 'Default'
    },
    'ParentFolderIds': {
        'FolderId': {
            'attributes': {
                'Id': "AAAQAGluZm9AZGV2c2hlZXAuZGUALgAAAAAAjqA3CMwI60CZG2lDXiUaVwEAOauHsedUbUO4mHQoHnFAOAAAFhWC5QAA"
            }
        }
    }
}

*/

/*
// initialize node-ews
const ews = new EWS(ewsConfig);

// define ews api function

var ewsFunction = 'FindItem';

let ewsArgs = {
    'attributes': {
        'Traversal': 'Shallow'
    },
    'ItemShape': {
        'BaseShape': 'IdOnly'
    },
    'ParentFolderIds': {
        'FolderId': {
            'attributes': {
                'Id': "AAAQAGluZm9AZGV2c2hlZXAuZGUALgAAAAAAjqA3CMwI60CZG2lDXiUaVwEAOauHsedUbUO4mHQoHnFAOAAAFhWC5gAA"
            }
        }
    }
}
//done:
//"AAAQAGluZm9AZGV2c2hlZXAuZGUALgAAAAAAjqA3CMwI60CZG2lDXiUaVwEAOauHsedUbUO4mHQoHnFAOAAAFhWC5wAA"
//todo:
//"AAAQAGluZm9AZGV2c2hlZXAuZGUALgAAAAAAjqA3CMwI60CZG2lDXiUaVwEAOauHsedUbUO4mHQoHnFAOAAAFhWC5gAA"


// query EWS and print resulting JSON to console
ews.run(ewsFunction, ewsArgs)
    .then(async result => {
        if (result.ResponseMessages.FindItemResponseMessage.ResponseCode == "NoError") {
            var ewsFunction = 'GetItem';

            let ewsArgs = {
                'attributes': {
                    'Traversal': 'Shallow'
                },
                'ItemShape': {
                    'BaseShape': 'Default',
                    'BodyType': 'Text'
                },
                'ItemIds': {
                    'ItemId': {
                        'attributes': {
                            'Id': ""
                        }
                    }
                }
            }
            for (const msg of result.ResponseMessages.FindItemResponseMessage.RootFolder.Items.Message) {
                ewsArgs.ItemIds.ItemId.attributes.Id = msg.ItemId.attributes.Id;
                console.log(ewsArgs);
                result = await ews.run(ewsFunction, ewsArgs)
                if (result.ResponseMessages.GetItemResponseMessage.ResponseCode == "NoError") {
                    const body = result.ResponseMessages.GetItemResponseMessage.Items.Message.Body.$value;
                    console.log(body);
                    console.log(body.match(/.*W3Booster Pro \(\#([a-zA-Z0-9]+)\)/));
                    const matches = body.match(/.*W3Booster Pro \(\#([a-zA-Z0-9]+)\)/);
                    if(matches) {
                        const userId = matches[1];
                        console.log(userId);
                    }

                    //console.log(result.ResponseMessages.GetItemResponseMessage.Items.Message.Body.$value.indexOf("Days W3Booster Pro (#"));
                }

            }//

            console.log("AAAAAAAAAAAAAAAAAAAAAAAAAAA")
            //console.log(JSON.stringify(result));
        }

    })
    .catch(err => {
        console.log("XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX")
        console.log(err.message);
    });


*/
