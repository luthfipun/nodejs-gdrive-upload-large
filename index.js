const fs = require('fs');
const {google} = require('googleapis');
const request = require('request');
const serviceAccount = require('./service-account.json');

const getToken = async () => {
    const googleAuth = new google.auth.JWT(
        serviceAccount.client_email,
        null,
        serviceAccount.private_key,
        ['https://www.googleapis.com/auth/drive'],
        null
    )
    
    let getTokenData = new Promise(async (resolve, reject) => {
        await googleAuth.authorize((err, token) => {
            if(err){
                reject(err.message)
                return
            }
        
            resolve(token)
        })
    })

    return getTokenData.then((res) => {
        return res
    }, reason => {
        console.log(reason);
        return
    })
}

const uploadData = async (name, path) => {
    let getTokenData = await getToken();
    let token = `${getTokenData.token_type} ${getTokenData.access_token}`;

    let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable';

    let options = {
        headers: {
            Authorization: token,
            'Content-Type': 'application/json; charset=UTF-8',
        },
        body: JSON.stringify({name: name}),
        url: url,
        method: 'POST'
    }

    await request(url, options,  async(err, res) => {
        if(err){
            console.log(err.message);
            return
        }

        let size = fs.statSync(path).size;

        await request({
            method: 'PUT',
            url: res.headers.location,
            headers: {
                "Content-Range": `bytes 0-${size - 1}/${size}`
            },
            body: fs.readFileSync(path)
        }, (error, response) => {
                if(error){
                    console.log(error.message);
                    return
                }

                console.log(response);
            })
    })
}

const listData = async () => {
    const auth = new google.auth.GoogleAuth({
        keyFile: './service-account.json',
        scopes: ['https://www.googleapis.com/auth/drive'],
    });
    
    const drive = google.drive({
        version: 'v3',
        auth
    });

    await drive.files.list({
        fields: '*/*'
    }).then((res) => {
        
        res.data.files.forEach(element => {
            let data = {
                id: element.id,
                name: element.name,
                size: element.size
            }

            console.log(data);
        });

    }).catch((err) => {
        console.log(err.message);
    })
}

(async() => {
    let filePath = 'path-to-location-file';
    uploadData('test.txt', filePath)
})()