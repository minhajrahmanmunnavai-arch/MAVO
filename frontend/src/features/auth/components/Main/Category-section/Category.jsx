import { Curated } from "./Curated -Lines"
import { CategoryTitle } from "./Category-title"
import { CtaregoryItems } from "./Ctaregory-items"

const Category = () => {

  const details = [
    
    {
      subTitle: "Curated Lines",
      tile: "Shop by Category",
      button: "All Collections"
    },
  ]

  const CategoryDetails = [
    {
      img: "https://i.pinimg.com/736x/ef/dd/b1/efddb1591ecb122288aab328daead3fc.jpg",
      title: "Watches & Horology",
      Artifacts: "24"
    },
    {
      img: "https://i.pinimg.com/736x/e0/19/15/e01915d7def93630dab68da4bb3eabf9.jpg",
      title: "Lighting & Lamps",
      Artifacts: "18"
    },
    {
      img: "https://i.pinimg.com/1200x/6b/88/a3/6b88a33ee704777791a6e14b32240247.jpg",
      title: "Leathercraft & Bags",
      Artifacts: "32"
    },
    {
      img: "https://i.pinimg.com/736x/49/4f/e4/494fe404aacf2e8a40e13ee1d9e68a65.jpg",
      title: "Studio Audio & Sound",
      Artifacts: "16"
    }
  ]


  return (
    <section className="mt-25 px-37" >
      {details.map((elem, idx) => (
        <Curated
          key={idx}
          subTitle={elem.subTitle}
        />
      ))}
      {details.map((elem, idx) => (
        <CategoryTitle
          key={idx}
          tile={elem.tile}
          button={elem.button}
        />
      ))}
      <div className="category-card-grid flex justify-between mt-7">
        {CategoryDetails.map((elem, idx) => (
          <CtaregoryItems
            key={idx}
            img={elem.img}
            title={elem.title}
            Artifacts={elem.Artifacts}
          />
        ))}
      </div>
    </section>
  )
}

export default Category