import "./index.css";
import { Composition } from "remotion";
import { RofaqaaPromo } from "./Composition";

export const RemotionRoot: React.FC = () => (
  <Composition
    id="RofaqaaPromo"
    component={RofaqaaPromo}
    durationInFrames={1800}
    fps={30}
    width={1920}
    height={1080}
  />
);
