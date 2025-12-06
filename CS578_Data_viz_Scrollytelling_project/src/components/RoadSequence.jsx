/* FINAL NON-GLITCH SCROLL SEQUENCE */
import { useEffect } from "react";
import "./RoadSequence.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import evCar from "../assets/car_ev.png";
import iceCar from "../assets/car_ice.png";

import ConEVChart from "./ConEVChart";
import EVAdoptionChart from "./EVAdoptionChart";
import LifecycleCompass from "./LifecycleCompass";

gsap.registerPlugin(ScrollTrigger);

export default function RoadSequence() {
  useEffect(() => {

    const resetCars = () => {
      gsap.set("#evcar", { y: 0, opacity: 1 });
      gsap.set("#icecar", { y: 0, opacity: 1 });
      gsap.set("#ev-vapor", { opacity: 0.25 });
      gsap.set("#ice-vapor", { opacity: 0.25 });
    };
    resetCars();

    /* Idle motion */
    gsap.to("#evcar", {
      x: "+=3",
      rotation: 0.6,
      duration: 1.4,
      repeat: -1,
      yoyo: true,
    });
    gsap.to("#icecar", {
      x: "-=3",
      rotation: -0.6,
      duration: 1.4,
      repeat: -1,
      yoyo: true,
    });
    gsap.to(["#ev-vapor", "#ice-vapor"], {
      scale: 1.22,
      duration: 1.2,
      repeat: -1,
      yoyo: true,
    });

    /* Show road when entering sequence */
    ScrollTrigger.create({
      trigger: "#road-sequence-root",
      start: "top 80%",
      onEnter: () => gsap.to("#road-strip", { opacity: 1 }),
      onLeaveBack: () => gsap.to("#road-strip", { opacity: 0 }),
    });

    /* EV SECTION */
    gsap.timeline({
      scrollTrigger: {
        trigger: "#ev-panel",
        start: "top center",
        end: "bottom center",
        scrub: 1,
        onEnter: resetCars,
      }
    })
    .to("#evcar", { y: 100 }, 0)
    .to("#icecar", { y: -100, opacity: 0.25 }, 0);

    /* CENTER PANEL RESET */
    gsap.timeline({
      scrollTrigger: {
        trigger: "#center-panel",
        start: "top center",
        end: "bottom center",
        scrub: 1,
      }
    })
    .to(["#evcar","#icecar"], { y: 0, opacity: 1 }, 0);

    /* ICE SECTION movement */
    gsap.timeline({
      scrollTrigger: {
        trigger: "#ice-panel",
        start:"top center",
        end:"bottom center",
        scrub:1,
        onEnter: resetCars,
      }
    })
    .to("#icecar", { y: 100 },0)
    .to("#evcar", { y: -100, opacity:0.25 },0);

    /* Dashed center line movement */
    gsap.to(".center-line", {
      backgroundPositionY: "-=200",
      repeat: -1,
      ease: "none",
      duration: 2.5
    });

    /* ROAD ONLY FADES AT CONCLUSION */
    gsap.timeline({
      scrollTrigger: {
        trigger: "#conclusion",
        start:"top center",
        scrub:1
      }
    })
    .to("#road-strip", { opacity:0 },0)
    .to(["#evcar","#icecar","#ev-vapor","#ice-vapor"], { opacity:0 },0);

  }, []);

  return (
    <section id="road-sequence-root" className="road-sequence">

      {/* FIXED CENTER ROAD */}
      <div id="road-strip">
        <div className="road-surface">
          <div className="ev-grid"/>
          <div className="ice-asphalt"/>
          <div className="center-line"/>
          <div id="ev-vapor" className="vapor vapor-ev"/>
          <div id="ice-vapor" className="vapor vapor-ice"/>
          <img id="evcar" src={evCar} className="car-img car-ev"/>
          <img id="icecar" src={iceCar} className="car-img car-ice"/>
        </div>
      </div>

      {/* ================= EV PANEL ================= */}
      <section className="scroll-section" id="ev-panel">
        <div className="pinned pinned-left">
          <h2 className="section-title">Where EVs Pull Ahead</h2>
          <p>EVs eliminate tailpipe emissions.</p>
          <p>As grids get cleaner, EV miles get cleaner.</p>
        </div>
        <div></div>
        <div></div>
      </section>

      <section className="spacer"></section>

      {/* ================= CENTER PANEL ================= */}
      <section className="scroll-section" id="center-panel">
        <div></div>
        <div className="center-text-overlay">
          <div className="center-line-text">Lifecycle emissions come from different phases.</div>
          <div className="center-line-text">Understanding them requires deeper comparison.</div>
        </div>
        <div></div>
      </section>

      <section className="spacer"></section>

      {/* ======================================================
           FINAL FIXED CON-EV SECTION WITH LARGE VISUALIZATIONS
      =======================================================*/}
      <section className="scroll-section" id="ice-panel">

        {/* LEFT VISUALIZATION COLUMN (always visible with road) */}
        <div className="cnev-left">

          <div className="viz-box"><LifecycleCompass/></div>
          <div className="viz-box"><EVAdoptionChart/></div>
          <div className="viz-box"><ConEVChart/></div>

        </div>

        {/* CENTER — ROAD stays visible */}
        <div></div>

        {/* RIGHT — PINNED NARRATIVE */}
        <div className="pinned pinned-right">
          <h2 className="section-title">Where EVs Struggle</h2>
          <p>Battery mining has a high environmental cost.</p>
          <p>These charts show when EVs eventually break even.</p>
        </div>

      </section>

      <section className="spacer"></section>

      {/* ================= CONCLUSION (road fades here) ================= */}
      <section className="conclusion" id="conclusion">
        <h2 className="section-title">Final Thoughts</h2>
        <p>
          EVs excel in long-term sustainability as power grids decarbonize.
        </p>
        <p>
          Understanding lifecycle differences helps inform better decisions.
        </p>
      </section>

    </section>
  );
}
