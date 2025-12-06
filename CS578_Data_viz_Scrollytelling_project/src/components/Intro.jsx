import "./Intro.css";
import carsImg from "../assets/cars.jpg";

export default function Intro() {
  return (
    <section className="intro-section" id="intro-section">

      <div className="intro-columns">
        <div className="intro-image">
          <img className="cars" src={carsImg} alt="Cars" />
        </div>

        <p className="intro-p dropcap">
          For years, electric vehicles (EVs) have been celebrated as the clear path toward 
          a cleaner and more sustainable future. Their promise is simple and compelling: no 
          tailpipe emissions, lower operating costs, and a technology that feels aligned 
          with the fight against climate change. At the same time, internal combustion engine 
          (ICE) vehicles — the backbone of global transportation for more than a century — 
          are increasingly viewed as outdated, inefficient, and environmentally burdensome.
        </p>

        <p className="intro-p">
          But when you begin to look beyond the headlines and dig into the full lifecycle 
          of these technologies, the story becomes far more complex. EVs may run quietly on 
          electricity, yet their batteries require vast amounts of lithium, cobalt, nickel, 
          and graphite — materials that come with real environmental and human costs. Mining 
          operations disturb landscapes, consume water, create waste, and often take place 
          in ecologically sensitive regions.
        </p>

        <p className="intro-p">
          Meanwhile, ICE vehicles, though familiar, continue to emit carbon dioxide, 
          nitrogen oxides, and particulate matter throughout their lifespan, contributing 
          steadily to air pollution and warming temperatures.
        </p>

        <p className="intro-p">
          This project aims to move past oversimplified “EVs good, ICE bad” narratives by 
          visualizing the environmental trade-offs across the entire lifecycle of both 
          vehicle types. Through data-driven graphics, spatial maps, and comparative 
          analyses, the goal is not to choose a winner, but to understand the impacts we 
          rarely see.
        </p>

        <p className="intro-p">
          By putting these impacts side-by-side, this project invites the viewer to grapple 
          with a more honest version of the energy transition — one that acknowledges both 
          the hope embedded in new technologies and the responsibilities that come with them.
        </p>

        <p className="intro-final">
          Let’s explore the full picture.
        </p>

      </div>
    </section>
  );
}
