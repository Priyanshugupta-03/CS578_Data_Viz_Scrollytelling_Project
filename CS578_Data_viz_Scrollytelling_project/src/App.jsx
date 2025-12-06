import Intro from "./components/Intro";
import Landing from "./components/Landing";
import BackgroundWater from "./components/BackgroundWater";
import OverlayGradient from "./components/OverlayGradient";
import RoadSequence from "./components/RoadSequence";
import "./App.css";

import { useState, useRef } from "react";

export default function App() {
  const [started, setStarted] = useState(false);
  const introRef = useRef(null);

  const startExperience = () => {
    setStarted(true);
    setTimeout(() => {
      introRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 300);
  };

  return (
    <>
      <BackgroundWater />
      {started && <OverlayGradient />}

      <div className="app-shell">
        <main className="central-shell">
          <Landing started={started} onStart={startExperience} />

          <div ref={introRef}>
            <Intro />
          </div>
        </main>
        <RoadSequence />
      </div>
    </>
  );
}
