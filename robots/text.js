const algorithmia = require('algorithmia')
const sentenceBoundaryDetection = require('sbd')
const algorithmiaApiKey = require('../credentials/algorithmia.json').apiKey
const watsonApi = require('../credentials/watson-nlu.json')

const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1.js');
const { IamAuthenticator } = require('ibm-watson/auth');

var nlu = new NaturalLanguageUnderstandingV1({
    authenticator: new IamAuthenticator({ apikey: watsonApi.apikey }),
    version: '2018-04-05',
    url: watsonApi.url
})

async function robot(sourceContent) {

    await fetchContentFromWikipedia(sourceContent)
    sanitizeContent(sourceContent)
    breakContentIntoSentences(sourceContent)
    limitMaximumSentences(sourceContent)
    await fetchKeywordsOfAllSentences(sourceContent)

    async function fetchContentFromWikipedia(sourceContent) {
        console.log('[text-roboto] Fetching content from Wikipedia')
        const algorithmiaAuthenticated = algorithmia(algorithmiaApiKey)
        const wikipediaAlgorithm = algorithmiaAuthenticated.algo('web/WikipediaParser/0.1.2')
        const wikipediaResponse = await wikipediaAlgorithm.pipe(sourceContent.searchTerm)
        const wikipediaContent = wikipediaResponse.get()

        sourceContent.sourceContentOriginal = wikipediaContent.content
        console.log('[text-roboto] Fetching done!')
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

    function limitMaximumSentences(sourceContent) {
        sourceContent.sentences = sourceContent.sentences.slice(0, sourceContent.maximumSentences)
    }

    async function fetchKeywordsOfAllSentences(sourceContent) {
        console.log('[text-roboto] Starting to fetch keywords from Watson')
    
        for (const sentence of sourceContent.sentences) {
          console.log(`[text-roboto] Sentence: "${sentence.text}"`)
    
          sentence.keywords = await fetchWatsonAndReturnKeywords(sentence.text)
    
          console.log(`[text-roboto] Keywords: ${sentence.keywords.join(', ')}\n`)
        }
      }

    async function fetchWatsonAndReturnKeywords(sentence) {
        return new Promise((resolve, reject) => {
          nlu.analyze({
            html: sentence,
            language:'en',
            features: {
              keywords: {}
            }
          }).then(response => {
            if (response === undefined || response.result === undefined) {
                reject(response)
                return
              }
      
              const keywords = response.result.keywords.map((keyword) => {
                return keyword.text
              })
      
              resolve(keywords)
          })
          .catch(err => {
            console.log('error: ', err)
          })
        })
      }
    
}

module.exports = robot