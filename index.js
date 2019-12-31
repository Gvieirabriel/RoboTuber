const readline = require('readline-sync')
const robots = {
    //userInput: require('./robots/user-inputs.js'),
    text: require('./robots/text.js')
}

async function start() {

    const sourceContent = {
    }

    sourceContent.searchTerm = askAndReturnSearchTerm()
    sourceContent.prefix = askAndReturnPrefix()

    await robots.text(sourceContent)

    function askAndReturnSearchTerm() {
        return readline.question('Type a source search term: ')
    }

    function askAndReturnPrefix() {
        const prefixes = ['Who is', 'What is', 'The history of']
        const selectedPrefixIndex = readline.keyInSelect(prefixes)
        const selectedPrefixText = prefixes[selectedPrefixIndex]

        return selectedPrefixText;
    }

    console.log(sourceContent)
}

start() 