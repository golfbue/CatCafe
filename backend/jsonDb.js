const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, 'data');

const getFilePath = (collection) => path.join(DATA_DIR, `${collection}.json`);

const readData = (collection) => {
    const filePath = getFilePath(collection);
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content || '[]');
};

const writeData = (collection, data) => {
    const filePath = getFilePath(collection);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
};

const jsonDb = {
    getAll: (collection) => readData(collection),
    
    getById: (collection, id, idField = 'id') => {
        const data = readData(collection);
        return data.find(item => item[idField] == id);
    },

    create: (collection, newItem) => {
        const data = readData(collection);
        data.push(newItem);
        writeData(collection, data);
        return newItem;
    },

    update: (collection, id, updatedFields, idField = 'id') => {
        const data = readData(collection);
        const index = data.findIndex(item => item[idField] == id);
        if (index !== -1) {
            data[index] = { ...data[index], ...updatedFields };
            writeData(collection, data);
            return data[index];
        }
        return null;
    },

    delete: (collection, id, idField = 'id') => {
        let data = readData(collection);
        const initialLength = data.length;
        data = data.filter(item => item[idField] != id);
        if (data.length < initialLength) {
            writeData(collection, data);
            return true;
        }
        return false;
    }
};

module.exports = jsonDb;
