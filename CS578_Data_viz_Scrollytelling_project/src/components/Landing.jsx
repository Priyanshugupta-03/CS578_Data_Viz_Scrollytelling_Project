import "./Landing.css";

export default function Landing({ started, onStart }) {
  return (
    <section className={`landing-section ${started ? "landing-up" : ""}`}>
      <div className="landing-content">
        <h1 className="landing-title">
          CHARGING AHEAD OR BURNING OUT?
        </h1>

        <p className="landing-subtitle">
          Visualizing the Environmental Trade-Offs Between Electric and ICE Vehicles
        </p>

        {!started && (
          <button className="enter-btn" onClick={onStart}>
            Enter Experience
          </button>
        )}
      </div>
    </section>
  );
}
