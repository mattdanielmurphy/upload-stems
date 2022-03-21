import AWS from 'aws-sdk'
import JSONdb from 'simple-json-db'
import fs from 'fs'
import path from 'path'

const s3 = new AWS.S3({
	useAccelerateEndpoint: true,
	accessKeyId: process.env.AWSACCESSKEY,
	secretAccessKey: process.env.AWSSECRETKEY,
})

const uploadedStemsDb = new JSONdb('uploaded-stems.json', { jsonSpaces: 2 })
const uploadedStems = uploadedStemsDb.JSON()

async function uploadToS3(s3, pathToFile, s3Dir) {
	const fileContent = fs.readFileSync(pathToFile)
	const fileName = path.basename(pathToFile)
	const pathToZippedStemOnS3 = path.join(s3Dir, fileName)
	const params = {
		Bucket: 'ghost-sample-library',
		Key: pathToZippedStemOnS3,
		Body: fileContent,
	}
	console.log('uploading to s3...')
	await new Promise((resolve, reject) => {
		s3.upload(params, (err, data) => {
			if (err) reject(err)
			console.log('file uploaded', data?.Key)
			uploadedStemsDb.set(fileName, true)
			resolve('')
		})
	})
}

const dir = path.resolve(process.argv[2])
const stems = fs
	.readdirSync(dir)
	.filter(
		(file) =>
			file.endsWith('.wav') &&
			!file.startsWith('.') &&
			!file.includes('Sample'),
	)

async function uploadStems() {
	for (const stem of stems) {
		const pathToStem = path.join(dir, stem)
		if (!Object.keys(uploadedStems).includes(stem)) {
			await uploadToS3(s3, pathToStem, 'stems')
		}
	}
}
uploadStems()
