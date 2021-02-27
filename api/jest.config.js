module.exports = {
    "preset": "ts-jest",
    "transform": {
        ".(ts)": "<rootDir>/node_modules/ts-jest/preprocessor.js"
    },
    "testRegex": "(./test/.*\\.(test|spec))\\.(ts)$",
    "moduleFileExtensions": ["ts", "tsx", "js"],
    "testPathIgnorePatterns": [
        "node_modules"
    ]
};