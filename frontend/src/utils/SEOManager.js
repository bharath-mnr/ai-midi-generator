import { useEffect } from 'react'
import TextMidiConverter from '../Components/TextMidiConverter'
import ChatBot from '../Components/ChatBot'

// SEO page data for dynamic meta tags
export const pageData = {
  'home': {
    title: 'MIDI Tools Suite',
    description: 'Complete MIDI toolkit with 20+ tools including Text to MIDI converter, MIDI to Text converter and more. Fast, secure, and free online MIDI processing.',
    keywords: 'MIDI converter, MIDI tools, Text to MIDI, MIDI to Text'
  },
  ChatBot: {
    title: 'ChatBot - AI-Powered MIDI Generation',
    description: 'Interact with our AI-powered ChatBot to generate MIDI compositions from text prompts. Fast, secure, and free online MIDI processing.',
    keywords: 'ChatBot, AI, MIDI generation, text to MIDI, online MIDI tools'
  },
  'text-midi-converter': {
    title: 'Text to MIDI Converter - Convert Text Notation to MIDI Online',
    description: 'Convert Text notation to MIDI files online. Free and easy-to-use Text to MIDI converter for musicians and composers.',
    keywords: 'Text to MIDI, MIDI converter, online MIDI conversion, music notation'
  },
  'midi-to-text-converter': {
    title: 'MIDI to Text Converter - Convert MIDI to Text Notation Online',
    description: 'Convert MIDI files to Text notation online. Free and efficient MIDI to Text converter for music enthusiasts and composers.',
    keywords: 'MIDI to Text, Text converter, online Text conversion, music notation'
  },
  // Add more pages as needed

}

// SEO Manager Component
export const SEOManager = ({ pageKey }) => {
  const data = pageData[pageKey] || pageData['home']

  useEffect(() => {
    // Update document title
    document.title = data.title

    // Helper function to update meta tag
    const updateMetaTag = (selector, attribute, value) => {
      let element = document.querySelector(selector)
      if (!element) {
        // Create the meta tag if it doesn't exist
        element = document.createElement('meta')
        if (selector.startsWith('meta[name="')) {
          element.setAttribute('name', selector.substring(11, selector.length - 2))
        } else if (selector.startsWith('meta[property="')) {
          element.setAttribute('property', selector.substring(15, selector.length - 2))
        }
        document.head.appendChild(element)
      }
      element.setAttribute(attribute, value)
    }

    // Update meta tags
    updateMetaTag('meta[name="description"]', 'content', data.description)
    updateMetaTag('meta[name="keywords"]', 'content', data.keywords) // Ensure this meta tag is in your HTML

    // Update Open Graph meta tags
    updateMetaTag('meta[property="og:title"]', 'content', data.title)
    updateMetaTag('meta[property="og:description"]', 'content', data.description)
    updateMetaTag('meta[property="og:image"]', 'content', data.image || '/preview.jpg') // Allow dynamic image or fallback

    // Update Twitter Card meta tags
    updateMetaTag('meta[name="twitter:title"]', 'content', data.title)
    updateMetaTag('meta[name="twitter:description"]', 'content', data.description)
    updateMetaTag('meta[name="twitter:image"]', 'content', data.image || '/preview.jpg') // Allow dynamic image or fallback
    updateMetaTag('meta[name="twitter:card"]', 'content', 'summary_large_image') // Ensure this is set correctly

    // Update canonical URL
    let canonical = document.querySelector('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.setAttribute('rel', 'canonical')
      document.head.appendChild(canonical)
    }
    const baseUrl = window.location.origin
    const currentPath = pageKey === 'home' ? '' : `/${pageKey}`
    canonical.setAttribute('href', `${baseUrl}${currentPath}`)

    // Update Open Graph URL
    let ogUrl = document.querySelector('meta[property="og:url"]')
    if (!ogUrl) {
      ogUrl = document.createElement('meta')
      ogUrl.setAttribute('property', 'og:url')
      document.head.appendChild(ogUrl)
    }
    ogUrl.setAttribute('content', `${baseUrl}${currentPath}`)

    // Update Twitter URL (often same as og:url)
    let twitterUrl = document.querySelector('meta[name="twitter:url"]')
    if (!twitterUrl) {
      twitterUrl = document.createElement('meta')
      twitterUrl.setAttribute('name', 'twitter:url')
      document.head.appendChild(twitterUrl)
    }
    twitterUrl.setAttribute('content', `${baseUrl}${currentPath}`)


  }, [data, pageKey]) // Dependencies should be correct

  return null
}

// Utility function to get page data
export const getPageData = (pageKey) => {
  return pageData[pageKey] || pageData['home']
}

// Generate sitemap data (for sitemap.xml generation)
export const generateSitemapData = () => {
  // IMPORTANT: Replace 'https://yourdomain.com' with your actual website domain
  const baseUrl = 'https://yourdomain.com'
  return Object.keys(pageData).map(page => ({
    url: page === 'home' ? baseUrl : `${baseUrl}/${page}`,
    lastmod: new Date().toISOString(),
    changefreq: 'weekly',
    priority: page === 'home' ? '1.0' : '0.8'
  }))
}