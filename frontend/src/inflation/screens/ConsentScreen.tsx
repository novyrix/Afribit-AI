import { motion } from 'framer-motion'
import { Glass, PillButton } from '../../components/ui/Glass'

const SPRING = { type: 'spring' as const, damping: 20, stiffness: 220 }

export function ConsentScreen({ onAccept }: { onAccept: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={SPRING}
      className="fixed inset-0 flex flex-col items-center justify-center px-5"
    >
      <div className="w-full max-w-sm">
        <Glass radius="card" className="p-6 flex flex-col gap-5">
          <div>
            <div className="font-ui text-11 text-bitcoin/80 tracking-wider uppercase mb-2">Before you begin</div>
            <h2 className="font-brand font-semibold text-22 text-white">Your data, your rights</h2>
          </div>

          <div className="flex flex-col gap-3 font-text text-14 text-white/70 leading-relaxed">
            <p>When you log a purchase, we store the item, price, and date. Your phone number — if provided — is never stored in plain text.</p>
            <p>Individual purchases are never publicly shown. Only community averages are published — and only when at least 5 data points exist for that item.</p>
            <p>You can request deletion of your data at any time. Deleting your data removes it from future reports but does not alter published monthly reports.</p>
            <p>This data is used to produce the Kibera Cost of Living Index — a public monthly report that compares local prices to the official Kenya CPI.</p>
          </div>

          <div className="pt-2 border-t border-white/[0.07]">
            <p className="font-text text-13 text-white/45 mb-4">
              By continuing you confirm you have read the above and consent to your anonymised purchase data being used in community price research.
            </p>
            <PillButton onClick={onAccept}>I understand, continue</PillButton>
          </div>
        </Glass>
      </div>
    </motion.div>
  )
}
