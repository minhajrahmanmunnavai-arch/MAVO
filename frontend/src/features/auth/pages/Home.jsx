
import Hero from "../components/Main/Hero-section/Hero.jsx"
import Category from "../components/Main/Category-section/Category.jsx"
import Main from "../components/Main/Flash-Offerings/Main-Flash.jsx"
import Footer from "../components/Main/Footer/Footer.jsx"
import All from "../components/Main/All Products/All.jsx"

const Home = () => {
  return (
    <div className="home-page">
        <Hero />
        <Category />
        <Main />
        <All />
        <Footer />
    </div>
  )
}

export default Home