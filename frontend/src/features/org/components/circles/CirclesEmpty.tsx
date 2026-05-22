import type { ReactNode } from "react";
import { fadeUp } from "../../../../shared/pageAnimations";
import { motion } from "framer-motion";

interface CirclesEmptyProps {
  icon: React.ElementType;
  title: string;
  desc: string;
  action?: ReactNode;
}

export default function CirclesEmpty({ icon: Icon, title, desc, action }: CirclesEmptyProps) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex flex-col items-center justify-center p-12 text-center bg-white/40 dark:bg-slate-800/40 backdrop-blur-md rounded-2xl border border-white/60 dark:border-slate-700/60"
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 dark:text-slate-500 mb-4 shadow-inner">
        <Icon className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2">{title}</h3>
      <p className="text-slate-500 dark:text-slate-400 mb-6 max-w-sm">{desc}</p>
      {action}
    </motion.div>
  );
}
