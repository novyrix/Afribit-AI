import { motion } from 'framer-motion'

const SPRING = { type: 'spring' as const, damping: 18, stiffness: 200 }

export function ChooseModeScreen({ onPrograms }: { onPrograms: () => void }) {
  return (
    <motion.div
      key="chooseMode"
      className="fixed inset-0 flex flex-col items-center justify-center px-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.1 }}
        className="mb-2 font-ui text-13 text-white/40 tracking-widest uppercase"
      >
        Choose how to continue
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...SPRING, delay: 0.18 }}
        className="font-brand font-semibold text-[26px] text-white text-center leading-tight mb-10"
      >
        What are you here for?
      </motion.h1>

      <div className="w-full max-w-[340px] flex flex-col gap-4">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 0.38, x: 0 }}
          transition={{ ...SPRING, delay: 0.28 }}
          className="glass rounded-card p-5 relative cursor-not-allowed select-none"
        >
          <div className="absolute top-3 right-3">
            <span className="font-ui text-10 font-semibold tracking-wide uppercase
                             px-2 py-0.5 rounded-full bg-white/10 text-white/50">
              Coming soon
            </span>
          </div>
          <div className="font-brand font-semibold text-[18px] text-white mb-1">
            All in one
          </div>
          <div className="font-ui text-13 text-white/50 leading-snug">
            Bitcoin wallet + AI assistant + Programs
          </div>
          <div className="mt-4 flex gap-2">
            <span className="font-ui text-11 text-white/30 px-2 py-0.5 rounded-full bg-white/5">Wallet</span>
            <span className="font-ui text-11 text-white/30 px-2 py-0.5 rounded-full bg-white/5">AI</span>
            <span className="font-ui text-11 text-white/30 px-2 py-0.5 rounded-full bg-white/5">Programs</span>
          </div>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ ...SPRING, delay: 0.36 }}
          whileTap={{ scale: 0.97 }}
          onClick={onPrograms}
          className="glass rounded-card p-5 text-left w-full relative"
          style={{ borderColor: 'rgba(0,200,150,0.25)', border: '1px solid rgba(0,200,150,0.25)' }}
        >
          <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-[#00C896]" />
          <div className="font-brand font-semibold text-[18px] text-white mb-1">
            Afribit Programs
          </div>
          <div className="font-ui text-13 text-white/60 leading-snug">
            Join community programs, earn sats, make an impact
          </div>
          <div className="mt-4 flex gap-2">
            <span className="font-ui text-11 text-[#00C896]/70 px-2 py-0.5 rounded-full"
                  style={{ background: 'rgba(0,200,150,0.1)' }}>
              Taka Sats
            </span>
            <span className="font-ui text-11 text-white/30 px-2 py-0.5 rounded-full bg-white/5">
              + more
            </span>
          </div>
        </motion.button>
      </div>
    </motion.div>
  )
}
