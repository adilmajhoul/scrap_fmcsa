import fs from 'fs';

export async function measureJsonLength(fileName, fullPath) {
  // construct the path
  const filePath = fileName ? path.join(__dirname, fileName) : fullPath;
  // Read JSON file synchronously
  const jsonData = fs.readFileSync(filePath, 'utf8');

  // Convert JSON string to JavaScript object
  const jsonObjectLength = JSON.parse(jsonData).length;
  console.log('🚀 ~ measureJsonLength ~ jsonObjectLength:', jsonObjectLength);

  return jsonObjectLength;
}

measureJsonLength('', '/home/x/CODING/work/kardia/src/companies.json');
