import fs from 'fs';
import path from 'path';
import {RepositoryIndex, RepositoryIndexSet} from "./repository-index.model";
import { v4 as uuidv4 } from 'uuid';


// Ensure the index file exists
const indexFilePath = path.join(__dirname, '../repository/index.json');
if (!fs.existsSync(indexFilePath)) {
    const defaultIndex: RepositoryIndex = {
        version: "v1",
        publicId: uuidv4(),
        name: 'My Repository',
        imageUrl: "",
        homePageUrl: "",
        sets: [],
    };
    fs.writeFileSync(indexFilePath, JSON.stringify(defaultIndex));
}

// Load the current index file
const currentIndex: RepositoryIndex = JSON.parse(fs.readFileSync(indexFilePath).toString());
if (currentIndex.version !== 'v1') {
    console.error(`Build script does not support the current index version: ${currentIndex.version}`);
    process.exit(1);
}

// Construct sets
const sets: RepositoryIndexSet[] = fs.readdirSync(
    path.join(__dirname, '../repository/sets/')
).filter(
    fileName => fileName.endsWith('.json')
        && fs.lstatSync(path.join(__dirname, '../repository/sets/', fileName)).isFile()
).map(fileName => {
    try {
        const set = JSON.parse(fs.readFileSync(path.join(__dirname, '../repository/sets/', fileName)).toString());
        if (set.exportVersion !== 'v1') throw `Build script does not support set version "${set.exportVersion}"`;
        return {fileName, set};
    } catch (e) {
        console.error(`Could not process set ${fileName}:`);
        console.error(e);
        return null;
    }
}).filter(
    setData => setData !== null
).map((setData: any) => ({
    file: 'sets/' + setData.fileName,
    exportVersion: setData.set.exportVersion,
    name: setData.set.name,
    cardCount: setData.set.cards.length,
    modes: setData.set.modes,
    description: currentIndex.sets?.find(oldSet => oldSet.file === 'sets/' + setData.fileName)?.description ?? ""
}));

// Write sets to index
fs.writeFileSync(indexFilePath, JSON.stringify({...currentIndex, sets}));
console.log(`Successfully built repository index! (${sets.length} Set(s))`);

