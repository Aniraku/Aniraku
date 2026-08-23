import { useEffect } from 'react'
import { E } from './error.style'
import { FaArrowLeft, FaCompass, FaHome, FaRandom, FaSearch } from 'react-icons/fa'
import { useLocation } from 'react-router-dom'
import Footer from '../components/Footer/Footer'

const Error = () => {
  const location = useLocation()

  useEffect(() => {
    document.title = 'Page Not Found — Aniraku'
    // Ensure meta tags are updated for 404
    let metaDesc = document.querySelector('meta[name="description"]')
    if (metaDesc) metaDesc.setAttribute('content', 'Page not found on Aniraku — Free Anime Streaming. Browse our catalog to find anime.')
  }, [])

  return (
    <>
      <E.Container id="main">
        <E.Shell>
          <E.Card>
            <E.AmbientMark aria-hidden="true">404</E.AmbientMark>
            <E.Status><FaCompass size={12} /> Route unavailable</E.Status>
            <E.Code aria-label="Error code 404">404</E.Code>
            <E.Title>This story is off the map.</E.Title>
            <E.Text>The page you requested is not part of Aniraku. Return home or keep exploring the catalog.</E.Text>
            <E.Path aria-label="Unavailable route"><FaSearch size={11} /> {location.pathname || '/'}</E.Path>
            <E.Actions>
              <E.PrimaryLink to="/"><FaHome size={13} /> Back to Home</E.PrimaryLink>
              <E.SecondaryLink to="/catalog"><FaCompass size={13} /> Browse catalog</E.SecondaryLink>
            </E.Actions>
            <E.UtilityLink to="/random"><FaRandom size={12} /> Find a random anime</E.UtilityLink>
          </E.Card>
          <E.Note><FaArrowLeft size={11} /> The Home route lives at <strong>/</strong>.</E.Note>
        </E.Shell>
      </E.Container>
      <Footer compact />
    </>
  )
}

export default Error
