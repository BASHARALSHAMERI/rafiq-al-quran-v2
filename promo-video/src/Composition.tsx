import { Audio } from "@remotion/media";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  Series,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

const C = {
  emerald: "#064e3b",
  emeraldDark: "#022c22",
  gold: "#c5a059",
  white: "#fdfbf7",
  ink: "#102a24",
  muted: "#cfe3da",
};

const sceneFrames = [150, 240, 300, 330, 330, 270, 180];

const ease = (frame: number, fps: number, delay = 0) =>
  interpolate(frame, [delay * fps, (delay + 0.75) * fps], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

const Backdrop = () => (
  <AbsoluteFill style={{ background: C.emeraldDark }}>
    <Img
      src={staticFile("rafiq-splash-bg.svg")}
      style={{ width: "100%", height: "100%", objectFit: "cover" }}
    />
  </AbsoluteFill>
);

const Scene: React.FC<{ frames: number; children: React.ReactNode }> = ({
  frames,
  children,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = interpolate(
    frame,
    [0, fps * 0.35, frames - fps * 0.35, frames],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
  );

  return (
    <AbsoluteFill
      style={{
        opacity,
        overflow: "hidden",
        direction: "rtl",
        color: C.white,
        background: C.emeraldDark,
      }}
    >
      <Backdrop />
      {children}
    </AbsoluteFill>
  );
};

const Reveal: React.FC<{
  delay: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ delay, children, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = ease(frame, fps, delay);

  return (
    <div
      style={{
        opacity: p,
        transform: `translateY(${32 * (1 - p)}px)`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Brand: React.FC<{ compact?: boolean }> = ({ compact = false }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      gap: compact ? 24 : 44,
    }}
  >
    <Img
      src={staticFile("rafiq-logo.svg")}
      style={{ width: compact ? 92 : 190, height: compact ? 92 : 190 }}
    />
    <div>
      <div style={{ fontSize: compact ? 42 : 94, fontWeight: 900 }}>
        رفقاء القرآن
      </div>
      <div
        style={{
          marginTop: compact ? 8 : 20,
          color: C.gold,
          fontSize: compact ? 20 : 32,
        }}
      >
        لإدارة الجمعيات والمراكز القرآنية
      </div>
    </div>
  </div>
);

const Caption: React.FC<{ eyebrow: string; title: string }> = ({
  eyebrow,
  title,
}) => (
  <Reveal
    delay={0.35}
    style={{
      position: "absolute",
      right: 90,
      bottom: 62,
      zIndex: 5,
      padding: "20px 30px",
      borderRight: `5px solid ${C.gold}`,
      borderRadius: 8,
      background: "rgba(2,44,34,.92)",
      boxShadow: "0 18px 45px rgba(0,0,0,.25)",
    }}
  >
    <div style={{ color: C.gold, fontSize: 20, fontWeight: 800 }}>
      {eyebrow}
    </div>
    <div style={{ marginTop: 7, fontSize: 32, fontWeight: 900 }}>{title}</div>
  </Reveal>
);

const ProductShot: React.FC<{
  src: string;
  frames: number;
  startScale?: number;
  endScale?: number;
  x?: number;
}> = ({ src, frames, startScale = 1, endScale = 1.045, x = 0 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [0, frames], [0, 1], {
    easing: Easing.bezier(0.45, 0, 0.55, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const scale = interpolate(p, [0, 1], [startScale, endScale]);

  return (
    <Img
      src={staticFile(src)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover",
        transform: `translateX(${x * p}px) scale(${scale})`,
      }}
    />
  );
};

const Intro = () => (
  <Scene frames={sceneFrames[0]}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Reveal delay={0.3}>
        <Brand />
      </Reveal>
    </div>
  </Scene>
);

const Login = () => (
  <Scene frames={sceneFrames[1]}>
    <ProductShot src="web-login.png" frames={sceneFrames[1]} />
    <Caption eyebrow="هوية عربية موحدة" title="دخول واضح وآمن لكل مستخدم" />
  </Scene>
);

const Dashboard = () => (
  <Scene frames={sceneFrames[2]}>
    <ProductShot
      src="web-dashboard.png"
      frames={sceneFrames[2]}
      startScale={1.01}
      endScale={1.075}
    />
    <Caption eyebrow="لوحة الإدارة الفعلية" title="المؤشرات والقرارات في شاشة واحدة" />
  </Scene>
);

const Centers = () => (
  <Scene frames={sceneFrames[3]}>
    <ProductShot
      src="web-centers.png"
      frames={sceneFrames[3]}
      startScale={1.01}
      endScale={1.065}
    />
    <Caption eyebrow="إدارة المراكز" title="تنظيم الفروع والحلقات والصلاحيات" />
  </Scene>
);

const Operations = () => {
  const tags = [
    "الحضور والمتابعة",
    "خطط الحفظ",
    "الاختبارات والتقييم",
    "السجل الذهبي",
    "التلاوة عن بعد",
    "التقارير",
  ];

  return (
    <Scene frames={sceneFrames[4]}>
      <Reveal
        delay={0.2}
        style={{ position: "absolute", top: 85, right: 110, left: 110 }}
      >
        <Brand compact />
      </Reveal>
      <div
        style={{
          position: "absolute",
          top: 255,
          right: 110,
          left: 110,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 28,
        }}
      >
        {["web-dashboard.png", "web-centers.png"].map((src, index) => (
          <Reveal delay={0.6 + index * 0.25} key={src}>
            <div
              style={{
                height: 475,
                overflow: "hidden",
                border: "1px solid rgba(255,255,255,.24)",
                borderRadius: 8,
                boxShadow: "0 28px 70px rgba(0,0,0,.3)",
              }}
            >
              <Img
                src={staticFile(src)}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
          </Reveal>
        ))}
      </div>
      <div
        style={{
          position: "absolute",
          right: 110,
          left: 110,
          bottom: 82,
          display: "flex",
          justifyContent: "center",
          flexWrap: "wrap",
          gap: 14,
        }}
      >
        {tags.map((tag, index) => (
          <Reveal delay={1.2 + index * 0.16} key={tag}>
            <div
              style={{
                padding: "12px 20px",
                border: `1px solid ${C.gold}88`,
                borderRadius: 8,
                background: "rgba(2,44,34,.86)",
                fontSize: 20,
                fontWeight: 800,
              }}
            >
              {tag}
            </div>
          </Reveal>
        ))}
      </div>
    </Scene>
  );
};

const Finance = () => {
  const items = [
    "الفواتير والسندات",
    "التبرعات والخزينة",
    "الرواتب والمصروفات",
    "الأصول والتقارير المالية",
  ];

  return (
    <Scene frames={sceneFrames[5]}>
      <ProductShot
        src="web-dashboard.png"
        frames={sceneFrames[5]}
        startScale={1.08}
        endScale={1.16}
        x={-150}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(90deg, rgba(2,44,34,.97) 0%, rgba(2,44,34,.9) 34%, rgba(2,44,34,.1) 72%)",
        }}
      />
      <Reveal
        delay={0.35}
        style={{
          position: "absolute",
          top: 160,
          left: 110,
          width: 650,
          direction: "rtl",
        }}
      >
        <div style={{ color: C.gold, fontSize: 24, fontWeight: 900 }}>
          نظام مالي ومحاسبي متكامل
        </div>
        <div
          style={{ marginTop: 16, fontSize: 54, fontWeight: 900, lineHeight: 1.3 }}
        >
          رقابة مالية واضحة ومترابطة
        </div>
        <div style={{ marginTop: 38, display: "grid", gap: 16 }}>
          {items.map((item, index) => (
            <Reveal delay={0.9 + index * 0.25} key={item}>
              <div
                style={{
                  padding: "16px 22px",
                  borderRight: `4px solid ${C.gold}`,
                  background: "rgba(255,255,255,.08)",
                  fontSize: 24,
                  fontWeight: 800,
                }}
              >
                {item}
              </div>
            </Reveal>
          ))}
        </div>
      </Reveal>
    </Scene>
  );
};

const Outro = () => (
  <Scene frames={sceneFrames[6]}>
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <Reveal delay={0.15}>
        <Brand />
      </Reveal>
      <Reveal
        delay={0.9}
        style={{ marginTop: 38, color: C.muted, fontSize: 30 }}
      >
        شراكة رقمية في رحلة الحفظ والإتقان
      </Reveal>
    </div>
  </Scene>
);

export const RofaqaaPromo = () => {
  const { fps } = useVideoConfig();
  const scenes = [
    [sceneFrames[0], <Intro />],
    [sceneFrames[1], <Login />],
    [sceneFrames[2], <Dashboard />],
    [sceneFrames[3], <Centers />],
    [sceneFrames[4], <Operations />],
    [sceneFrames[5], <Finance />],
    [sceneFrames[6], <Outro />],
  ] as const;

  return (
    <AbsoluteFill>
      <Audio src={staticFile("voiceover.mp3")} />
      <Series>
        {scenes.map(([frames, scene], index) => (
          <Series.Sequence
            key={index}
            durationInFrames={frames}
            premountFor={fps}
          >
            {scene}
          </Series.Sequence>
        ))}
      </Series>
    </AbsoluteFill>
  );
};
