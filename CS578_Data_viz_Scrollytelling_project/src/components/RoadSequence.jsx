/* Scroll-driven EV vs ICE road sequence with image cars */
import { useEffect } from "react";
import "./RoadSequence.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import evCar from "../assets/car_ev.png";
import iceCar from "../assets/car_ice.png";

gsap.registerPlugin(ScrollTrigger);

export default function RoadSequence() {
  useEffect(() => {
    const resetCars = () => {
      gsap.set("#evcar", { y: 0, opacity: 1, zIndex: 3 });
      gsap.set("#icecar", { y: 0, opacity: 1, zIndex: 3 });
      gsap.set("#ev-vapor", { opacity: 0.25 });
      gsap.set("#ice-vapor", { opacity: 0.25 });
    };

    resetCars();

    gsap.to("#evcar", {
      x: "+=3",
      rotation: 1.2,
      duration: 1.4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.to("#icecar", {
      x: "-=3",
      rotation: -1.2,
      duration: 1.4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    gsap.to(["#ev-vapor", "#ice-vapor"], {
      scale: 1.22,
      duration: 1.2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    ScrollTrigger.create({
      trigger: "#road-sequence-root",
      start: "top 80%",
      end: "top 20%",
      onEnter: () => gsap.to("#road-strip", { opacity: 1, duration: 0.4 }),
      onLeaveBack: () => gsap.to("#road-strip", { opacity: 0, duration: 0.3 })
    });

    gsap.timeline({
      scrollTrigger: {
        trigger: "#ev-panel",
        start: "top center",
        end: "bottom center",
        scrub: 1,
        onEnter: resetCars,
        onEnterBack: resetCars
      }
    })
      .to("#evcar", { y: -160, opacity: 1, zIndex: 6 }, 0)
      .to("#ev-vapor", { opacity: 0.65 }, 0)
      .to("#icecar", { y: 40, opacity: 0.25, zIndex: 1 }, 0)
      .to("#ice-vapor", { opacity: 0.12 }, 0);

    gsap.timeline({
      scrollTrigger: {
        trigger: "#center-panel",
        start: "top center",
        end: "bottom center",
        scrub: 1
      }
    })
      .to(["#evcar", "#icecar"], { y: 0, opacity: 1, zIndex: 3 }, 0)
      .to(["#ev-vapor", "#ice-vapor"], { opacity: 0.25 }, 0);

    gsap.timeline({
      scrollTrigger: {
        trigger: "#ice-panel",
        start: "top center",
        end: "bottom center",
        scrub: 1,
        onEnter: resetCars,
        onEnterBack: resetCars
      }
    })
      .to("#icecar", { y: -160, opacity: 1, zIndex: 6 }, 0)
      .to("#ice-vapor", { opacity: 0.65 }, 0)
      .to("#evcar", { y: 40, opacity: 0.25, zIndex: 1 }, 0)
      .to("#ev-vapor", { opacity: 0.12 }, 0);

    gsap.timeline({
      scrollTrigger: {
        trigger: "#road-end-spacer",
        start: "top bottom", 
        end: "top center",
        scrub: true,
        markers: false
      }
    })
    .to(["#evcar", "#icecar"], {
      opacity: 0,
      ease: "none"
    }, 0)
    .to(["#ev-vapor", "#ice-vapor"], {
      opacity: 0,
      ease: "none"
    }, 0)
    .to("#road-strip", {
      opacity: 0,
      ease: "none"
    }, 0);


    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
      gsap.killTweensOf("*");
    };
  }, []);

  return (
    <section className="road-sequence" id="road-sequence-root">

      <div id="road-strip">
        <div className="road-surface">
          <div className="ev-grid" />
          <div className="ice-asphalt" />
          <div className="center-line" />

          <div id="ev-vapor" className="vapor vapor-ev" />
          <div id="ice-vapor" className="vapor vapor-ice" />

          <img
            id="evcar"
            src={evCar}
            alt="Electric vehicle"
            className="car-img car-ev"
          />
          <img
            id="icecar"
            src={iceCar}
            alt="Internal combustion vehicle"
            className="car-img car-ice"
          />
        </div>
      </div>

      <div className="road-panels">

        <section className="road-panel" id="ev-panel">
          <div className="panel-grid">
            <div className="panel-left">
              <h3>Where EVs Pull Ahead</h3>
              <p>
                EVs cut local air pollution and deliver higher efficiency in
                dense cities with cleaner grids.
              </p>
              <p>
                As electricity gets cleaner over time, each driven kilometer
                becomes cleaner too.
              </p>
            </div>
            <div className="panel-center" />
            <div className="panel-right" />
          </div>
        </section>

        <section className="road-panel" id="center-panel">
          <div className="panel-grid">
            <div className="panel-left">
            </div>
            <div className="panel-center" />
            <div className="panel-right">
              <h3>Re-Centering the Comparison</h3>
              <p>
                A fair comparison requires examining the systems beneath the
                vehicles: how electricity is produced, how fuels are transported,
                and what materials are required.
              </p>
            </div>
          </div>
        </section>

        <section className="road-panel" id="ice-panel">
          <div className="panel-grid">
            <div className="panel-left"></div>
            <div className="panel-center"></div>
            <div className="panel-right">
              <h3>Where EVs Struggle</h3>
              <p>
                Battery production is carbon–intensive, requiring lithium,
                cobalt, and nickel. Extraction affects ecosystems and
                communities across the globe.
              </p>
            </div>
          </div>
        </section>

      </div>
      <div id="road-end-spacer"></div>


      {/* Fade-out trigger so scrolling continues naturally */}
      <div id="road-fade-trigger" style={{ height: "50vh" }}></div>

    </section>
  );
}
