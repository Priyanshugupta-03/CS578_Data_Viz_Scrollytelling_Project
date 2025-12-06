import { useEffect } from "react";
import "./RoadSequence.css";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

import evCar from "../assets/car_ev.png";
import iceCar from "../assets/car_ice.png";
import ScrollCycleEmissionsChart from "./ScrollCycleEmissionsChart"
import LifecycleCompass from "./LifecycleCompass";
import ElectricityMixEVAdoption from "./ElectricityMixEVAdoption";
import MiningImpactViz from "./MiningImpactViz";
import EVvsICEEmissionsRadial from "./EVvsICEEmissionsRadial";
import EVAdoptionStreamgraph from "./EVAdoptionStreamgraph";
import RangeVsEfficiencyScatter from "./RangeVsEfficiencyScatter";
import CarbonPaybackBarChart from "./CarbonPaybackBarChart";
import GridMultiplierGauge from "./GridMultiplierGauge";

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
      ease: "sine.inOut",
    });

    gsap.to("#icecar", {
      x: "-=3",
      rotation: -1.2,
      duration: 1.4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    gsap.to(["#ev-vapor", "#ice-vapor"], {
      scale: 1.22,
      duration: 1.2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    ScrollTrigger.create({
      trigger: "#road-sequence-root",
      start: "top 80%",
      end: "top 20%",
      onEnter: () => gsap.to("#road-strip", { opacity: 1, duration: 0.4 }),
      onLeaveBack: () => gsap.to("#road-strip", { opacity: 0, duration: 0.3 }),
    });

    gsap.timeline({
      scrollTrigger: {
        trigger: "#ev-panel",
        start: "top center",
        end: "bottom center",
        scrub: 1,
        onEnter: resetCars,
        onEnterBack: resetCars,
      },
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
        scrub: 1,
      },
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
        onEnterBack: resetCars,
      },
    })
      .to("#icecar", { y: -160, opacity: 1, zIndex: 6 }, 0)
      .to("#ice-vapor", { opacity: 0.65 }, 0)
      .to("#evcar", { y: 40, opacity: 0.25, zIndex: 1 }, 0)
      .to("#ev-vapor", { opacity: 0.12 }, 0);

    gsap.timeline({
      scrollTrigger: {
        trigger: "#road-end-spacer",
        start: "bottom bottom",
        end: "top center",
        scrub: true,
      },
    })
      .to(["#evcar", "#icecar"], { opacity: 0 }, 0)
      .to(["#ev-vapor", "#ice-vapor"], { opacity: 0 }, 0)
      .to("#road-strip", { opacity: 0 }, 0);

    return () => {
      ScrollTrigger.getAll().forEach((t) => t.kill());
      gsap.killTweensOf("*");
    };
  }, []);

  return (
    <section className="road-sequence-wrapper">
      <section className="road-sequence" id="road-sequence-root">

        <div id="road-strip">
          <div className="road-surface">
            <div className="ev-grid" />
            <div className="ice-asphalt" />
            <div className="center-line" />

            <div id="ev-vapor" className="vapor vapor-ev" />
            <div id="ice-vapor" className="vapor vapor-ice" />

            <img id="evcar" src={evCar} className="car-img car-ev" alt="EV" />
            <img id="icecar" src={iceCar} className="car-img car-ice" alt="ICE" />
          </div>
        </div>

        <div className="road-panels">
          <section className="road-panel" id="ev-panel">
            <div className="panel-grid">
              <div className="panel-left">
                <h3>Where EVs Pull Ahead</h3>
                <p>Electric vehicle adoption is accelerating at a remarkable pace, reshaping how people think about transportation. What was once seen as a niche or futuristic choice is now becoming mainstream, driven by improvements in battery technology, expanded charging infrastructure, and growing environmental awareness. EVs are no longer just about reducing emissions—they represent a broader shift toward smarter, cleaner mobility. With longer driving ranges and faster charging times, EVs are increasingly practical for daily life, whether for commuting, road trips, or city travel.</p>
                <p>Governments and automakers are also playing a major role. Incentives, stricter emissions policies, and heavy investment in innovation have made EVs more affordable and accessible than ever before. At the same time, consumers are recognizing the benefits of quieter rides, lower maintenance costs, and reduced dependence on fossil fuels. Together, these trends point to a future where EVs are not an alternative, but the norm—supporting cleaner air, technological progress, and a more sustainable transportation system for generations to come.</p>
              </div>
              <div className="panel-center" />
              <div className="panel-right">
                <EVAdoptionStreamgraph />
              </div>
            </div>
          </section>

          <section className="road-panel" id="ev-panel">
            <div className="panel-grid">
              <div className="panel-left">
                <h3>When it comes to performance</h3>
                <p>When people talk about vehicle efficiency, range is often the first concern—especially when electric vehicles enter the conversation. But looking at range and efficiency together tells a richer story. For traditional gasoline vehicles, longer range usually comes from carrying more fuel, not necessarily using it more efficiently. Bigger tanks add weight, and that extra weight quietly works against fuel economy over time.</p>
                <p>Electric vehicles follow a very different pattern. Improvements in battery chemistry, regenerative braking, and motor efficiency mean that modern EVs are traveling farther while using less energy per kilometer. In many cases, gains in range are paired with gains in efficiency, not trade-offs. This is why newer EV models consistently achieve higher kilometers per kilowatt-hour while still matching—or exceeding—the driving range of comparable ICE vehicles.</p>
                <p>The relationship shown here highlights how technological progress in electric drivetrains is breaking the old assumption that longer range must come at the cost of efficiency.</p>
              </div>
              <div className="panel-center" />
              <div className="panel-right">
                <RangeVsEfficiencyScatter />
              </div>
            </div>
          </section>

          <section className="road-panel" id="ev-panel">
            <div className="panel-grid">
              <div className="panel-left">
                <h3>The Carbon Question</h3>
                <p>At first glance, electric vehicles can seem carbon-intensive because so much of their environmental impact is concentrated in manufacturing, especially battery production. But this front-loaded footprint tells only part of the story. Once an EV is on the road, its emissions drop dramatically compared to a gasoline car that continues producing carbon every time it’s driven. This is where the idea of “carbon payback” becomes powerful.</p>
                <p>As this comparison shows, EVs begin offsetting their higher manufacturing emissions relatively quickly, even on electricity grids that still rely partly on fossil fuels. When powered by cleaner or increasingly renewable grids, that payback period shrinks further, turning initial impact into long-term savings. In contrast, ICE vehicles never truly “pay back” their emissions—they accumulate carbon costs year after year as fuel is burned.</p>
                <p>The data highlights a key reality: choosing electric is less about a single moment in time and more about sustained environmental benefits that grow with every mile driven.</p>
              </div>
              <div className="panel-center" />
              <div className="panel-right">
                <CarbonPaybackBarChart />
              </div>
            </div>
          </section>

          <section className="road-panel" id="ev-panel">
            <div className="panel-grid">
              <div className="panel-left">
                <h3>Grids based analysis</h3>
                <p>The cleaner the electricity grid, the lower an EV’s operational emissions—and this is where electric vehicles truly pull ahead. Unlike gasoline cars, whose emissions are locked in at the tailpipe, EVs automatically become cleaner as the energy system around them improves. Every new solar installation, wind farm, or grid-scale battery quietly upgrades millions of electric vehicles already on the road.</p>
                <p>This multiplier effect makes EVs a future-proof choice. An electric car purchased today is not just cleaner than a conventional vehicle at the moment of sale; it continues to reduce its carbon footprint over time without any changes from the driver. In contrast, an ICE vehicle will emit roughly the same amount of pollution for its entire lifespan.</p>
                <p>The gauge highlights how even moderate improvements in grid cleanliness can deliver meaningful reductions in EV emissions, and as renewable penetration grows, those benefits accelerate. This dynamic relationship between EVs and the power grid turns infrastructure progress into everyday climate wins at the individual level.</p>
              </div>
              <div className="panel-center" />
              <div className="panel-right">
                <GridMultiplierGauge />
              </div>
            </div>
          </section>

          <section className="road-panel" id="center-panel">
            <div className="panel-grid">
              <div className="panel-left" />
              <div className="panel-center" />
              <div className="panel-right">
                <h3>Re-Centering the Comparison</h3>
                <p>
                  A fair comparison requires examining the systems beneath the
                  vehicles — electricity, fuels, infrastructure, and materials.
                </p>
              </div>
            </div>
          </section>

          <section className="road-panel" id="ice-panel">
            <div className="panel-grid">
              <div className="panel-left">
                
              </div>
              <div className="panel-center" />
              <div className="panel-right">
                
                <p>
                  EVs cut local air pollution and deliver higher efficiency in
                  dense cities with cleaner grids.
                </p>
                <p>
                  As electricity gets cleaner over time, each driven kilometer
                  becomes cleaner too. EVs cut local air pollution and deliver higher efficiency in dense cities with cleaner grids. As electricity gets cleaner over time, each driven kilometer becomes cleaner too. Beyond tailpipe benefits, electric motors convert roughly 85–92% of electrical energy into motion, compared to about 20–30% for internal combustion engines, sharply reducing wasted energy (IEA, 2023). In urban areas, this translates to lower concentrations of nitrogen oxides and particulate matter—pollutants strongly linked to asthma and cardiovascular disease (WHO, 2022). As renewable energy expands within national grids, the lifecycle carbon footprint of EVs continues to fall without requiring changes to the vehicle itself (IPCC, 2023).
                </p>
              </div>
            </div>
          </section>

          <section className="road-panel" id="ice-panel">
            <div className="panel-grid">
              <div className="panel-left">
                <ScrollCycleEmissionsChart />
              </div>
              <div className="panel-center" />
              <div className="panel-right">
                <h3>Break-Even Emissions Chart</h3>
                <p>
                  This visualization illustrates how the lifetime emissions of electric vehicles (EVs) compare to internal combustion engine (ICE) vehicles across different electricity grid scenarios. While EVs typically begin with higher manufacturing emissions due to battery production, their operational emissions decrease significantly over time—especially when charged with cleaner electricity.</p>

                <p>
                  Users can scroll through three scenarios—Clean Grid, Average Grid, and Coal-Heavy Grid—to observe how the break-even point shifts. The interactive crossing marker highlights the exact distance at which an EV becomes less carbon-intensive than an ICE vehicle.</p>

                <p>This visualization is impactful because it demonstrates that the environmental benefit of EVs is not fixed; instead, it depends heavily on the carbon intensity of the grid. It  effectively communicates that improving electricity generation is a crucial driver of EV sustainability.
                </p>
              </div>
            </div>
          </section>

          <section className="road-panel" id="ice-panel">
            <div className="panel-grid">
              <div className="panel-left">
                <ElectricityMixEVAdoption />
              </div>
              <div className="panel-center" />
              <div className="panel-right">
                <h3>EV Adoption Bar Race Chart</h3>
                <p>
                  This animated bar-race visualization shows how EV market share has evolved across major global regions—China, Europe, the United States, and the rest of the world—from 2015 to 2024. As the bars race forward year by year, viewers can quickly see which regions are driving global EV adoption and how rapidly growth has accelerated in the last decade.</p>
                  <p>The chart highlights important trends, such as Europe’s policy-driven surge, China’s scale-driven market transformation, and the slower pace in the U.S. The motion reinforces the sense of momentum behind EV adoption, making the growth story more intuitive and visually engaging.</p>
                  <p>This visualization is impactful because it transforms raw adoption statistics into a compelling narrative of technological diffusion. It helps viewers recognize that EVs are no longer a niche product—they are scaling rapidly worldwide, signaling a fundamental shift in the transportation sector.
                </p>
              </div>
            </div>
          </section>

          <section className="road-panel" id="ice-panel">
            <div className="panel-grid">
              <div className="panel-left">
                <LifecycleCompass />
              </div>
              <div className="panel-center" />
              <div className="panel-right">
                <h3>Lifecycle Compass Radar Chart</h3>
                <p>
                  The Lifecycle Compass provides a holistic comparison of EVs and ICE vehicles across four key impact categories: Manufacturing, Use Phase, End-of-Life, and Energy Dependency. The radar chart expands outward for higher values, allowing viewers to see at a glance where each vehicle type performs better or worse.</p>
                <p>EVs score higher in Energy Dependency due to reduced reliance on fossil fuels, and they outperform ICEs significantly in the Use Phase, where tailpipe emissions dominate. ICE vehicles, however, maintain an advantage in Manufacturing and sometimes in End-of-Life due to the heavy material requirements of batteries.</p>
                <p>The gentle pulsing animation reinforces the contrast between the two systems without overwhelming the viewer.</p>
                <p>This visualization is impactful because it reframes the EV vs. ICE debate from a single-metric comparison into a multi-dimensional assessment. It encourages viewers to think about sustainability in a broader, lifecycle-based way, rather than focusing only on emissions at the tailpipe or during production.
                </p>
              </div>
            </div>
          </section>

          <section className="road-panel" id="ice-panel">
            <div className="panel-grid">
              <div className="panel-left">
                <EVvsICEEmissionsRadial />
              </div>
              <div className="panel-center" />
              <div className="panel-right">
                <h3>Lifecycle Compass Radar Chart</h3>
                <p>
                </p>
              </div>
            </div>
          </section>

          {/* <section className="road-panel" id="ice-panel">
            <div className="panel-grid">
              <div className="panel-left">
                <MiningImpactViz />
              </div>
              <div className="panel-center" />
              <div className="panel-right">
                <h3>Where EVs Struggle</h3>
                <p>
                  Battery production is carbon-intensive and depends on mining
                  lithium, cobalt, and nickel with environmental trade-offs.
                </p>
              </div>
            </div>
          </section> */}
        </div>
      </section>
      <div id="road-end-spacer" style={{ height: "60vh" }} />
    </section>
  );
}
