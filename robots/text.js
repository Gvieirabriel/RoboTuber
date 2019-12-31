const algorithmia = require('algorithmia')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const sentenceBoundaryDetection = require('sbd')

async function robot(sourceContent) {
    await fetchContentFromWikipedia(sourceContent)
    sanitizeContent(sourceContent)
    breakContentIntoSentences(sourceContent)

    async function fetchContentFromWikipedia(sourceContent) {
        const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2')
        const wikipediaResponse = await wikipediaAlgorithm.pipe(sourceContent.searchTerm)
        const wikipediaContent = wikipediaResponse.get()

        sourceContent.sourceContentOriginal = wikipediaContent.content
    }

    function sanitizeContent(sourceContent) {
        const withoutBlankLinesAndMarkDown = removeBlankLines(sourceContent.sourceContentOriginal)
        const withoutDateInParentheses = removeDateInParentheses(withoutBlankLinesAndMarkDown)
 
        sourceContent.sourceContentSanitized = withoutDateInParentheses

        function removeBlankLines(text) {
            const allLines = text.split('\n')

            const withoutBlankLines = allLines.filter((line) => {
                if(line.trim().length === 0 || line.trim().startsWith('=')) {
                    return false
                }
                return true
            })

            return withoutBlankLines.join(' ')
        }

        function removeDateInParentheses(text) {
            return text.replace(/\((?:\([^()]*\)|[^()])*\)/gm, '').replace(/  /g,' ')
        }
    }

    function breakContentIntoSentences(sourceContent) {
        sourceContent.sentences = []

        const sentences = sentenceBoundaryDetection.sentences(sourceContent.sourceContentSanitized)
        sentences.forEach((sentence) => {
            sourceContent.sentences.push({
                text: sentence,
                keywords: [],
                images: []
            })
        })
    }
}

module.exports = robot