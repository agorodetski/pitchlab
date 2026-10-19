import { PitchMode, Scenario } from '../types';

export const DEFAULT_SCENARIOS: Record<PitchMode, Scenario[]> = {
  startup: [
    {
      title: 'DevOps Copilot Seed Round',
      audience: 'General Partner at a Top-Tier Seed Fund (First Round Capital)',
      context: 'Your team built an AI telemetry agent that detects and auto-patches production memory leaks in Kubernetes before outages trigger.',
      objective: 'Hook the investor with your proprietary moat, current traction ($35k MRR, 18% MoM), and the $2.5M round size.',
      keyConstraint: 'VC is skeptical of "yet another AI wrapper" and asks why Datadog won\'t build this by Q4.',
      starterTip: 'Lead with the customer pain cost and your unfair technical advantage.'
    },
    {
      title: 'Decarbonization Logistics Platform',
      audience: 'Climate Tech Lead at Breakthrough Energy Ventures',
      context: 'You provide automated freight route optimization and load bundling that reduces heavy trucking carbon emissions by 28% while saving 12% in diesel costs.',
      objective: 'Prove the dual-incentive business case: shippers adopt it for cost savings, stay for ESG compliance.',
      keyConstraint: 'Shippers operate on razor-thin 3% margins and are notorious for 9-month sales cycles.',
      starterTip: 'Highlight rapid pilot time-to-value and proven payback period.'
    },
    {
      title: 'Autonomous Clinical Scribe for ERs',
      audience: 'Healthcare Venture Partner at Bessemer',
      context: 'Emergency room physicians spend 2.5 hours per shift on EHR charting. Your ambient microphone solution generates certified Epic/Cerner notes with 99.4% billing code accuracy.',
      objective: 'Convince the VC that your HIPAA-compliant workflow has zero doctor churn across 14 hospital trial wings.',
      keyConstraint: 'Hospitals have agonizing enterprise procurement and strict data privacy regulations.',
      starterTip: 'Contrast burnout statistics with your concrete trial metrics.'
    }
  ],
  consulting: [
    {
      title: 'Omnichannel Retail Margin Decline',
      audience: 'Senior Engagement Manager at McKinsey & Company',
      context: 'A $4B national apparel retailer experienced a 350 bps gross margin contraction over the past three quarters despite a 6% revenue uptick.',
      objective: 'Lay out a MECE hypothesis-driven structure to diagnose whether the root cause is promotional discounting, return logistics, or supply chain inflation.',
      keyConstraint: 'You have only 60 seconds to state your core hypothesis and prioritized 3-pillar breakdown.',
      starterTip: 'Start with an executive summary sentence, then introduce your three mutually exclusive pillars.'
    },
    {
      title: 'Airline Loyalty Program Spin-Off',
      audience: 'Strategy Partner at Boston Consulting Group (BCG)',
      context: 'A major North American airline is evaluating whether to monetize or spin off its frequent flier loyalty program into an independent financial entity.',
      objective: 'Present your framework evaluating valuation upside vs airline brand dilution and customer retention risks.',
      keyConstraint: 'Do not get bogged down in math; provide a high-level strategic trade-off framework.',
      starterTip: 'Structure by Value Creation, Operational Feasibility, and Risk Mitigation.'
    },
    {
      title: 'Electric Vehicle Fleet Transition',
      audience: 'Principal at Bain & Company (Private Equity Group)',
      context: 'A portfolio company operating 12,000 regional delivery vans is considering transitioning 100% of its fleet to electric vehicles over 36 months.',
      objective: 'Outline the critical investment criteria: CapEx vs OpEx lifecycle TCO, charging grid infrastructure, and residual value risk.',
      keyConstraint: 'Grid capacity upgrades at 40% of depots require 18 months of municipal permitting.',
      starterTip: 'Frame around unit economics per mile and operational readiness.'
    }
  ],
  elevator: [
    {
      title: 'Fintech Fraud Prevention Hook',
      audience: 'Chief Risk Officer of a Top-5 Global Retail Bank',
      context: 'You share an elevator going up to the 40th floor at the annual Sibos banking conference.',
      objective: 'Deliver an unforgettable 45-second hook on how your graph-neural-network engine catches synthetic identity fraud before funds leave the wire.',
      keyConstraint: 'The elevator chime sounds at floor 20—you have under 30 seconds left to lock in a meeting with their team.',
      starterTip: 'Use a startling metric: "Banks lost $4.8B to synthetic identities last year because legacy rules look at single accounts."'
    },
    {
      title: 'Enterprise Cyber Zero-Trust',
      audience: 'Chief Information Security Officer (CISO) of Pfizer',
      context: 'You run into the CISO at an exclusive cyber briefing coffee bar before their keynote address.',
      objective: 'Pitch your automated secret-rotation and identity governance platform that eliminates developer credential sprawl.',
      keyConstraint: 'They are looking at their watch and are surrounded by two conference handlers.',
      starterTip: 'Acknowledge their limited time and ask for a 15-minute briefing with their VP of Identity.'
    },
    {
      title: 'B2B Procurement Intelligence',
      audience: 'Chief Procurement Officer of Boeing',
      context: 'You sit next to each other on a red-eye flight from Seattle to Chicago waiting for takeoff.',
      objective: 'Explain how real-time Tier-2 supplier financial health telemetry prevents sole-source manufacturing shutdowns.',
      keyConstraint: 'Be conversational, respectful, and authoritative without sounding like an aggressive telemarketer.',
      starterTip: 'Speak to the nightmare of unannounced supplier insolvencies.'
    }
  ],
  freestyle: [
    {
      title: 'Internal AI Tooling Budget Request',
      audience: 'VP of Engineering and CFO',
      context: 'You are an Engineering Lead pitching a migration to an internal AI-assisted developer telemetry platform to cut CI/CD build bottlenecks and AWS compute overhead.',
      objective: 'Secure approval for a 6-month trial budget ($120k) and 2 dedicated sprint cycles from the platform team.',
      keyConstraint: 'CFO is enforcing strict cost freezes across all software tooling this quarter.',
      starterTip: 'Quantify developer hours lost per month against the direct annual savings.',
      customCriteria: 'Clearly quantify financial ROI, address security/data leakage risk, and present a phased 60-day migration milestone roadmap.'
    },
    {
      title: 'Executive Role Final Interview Story',
      audience: 'CEO and Lead Board Director',
      context: 'Final interview stage for a VP / Head of Operations role at a high-growth scale-up.',
      objective: 'Articulate your 90-day turnaround strategy to reduce cross-departmental delivery friction and scale execution.',
      keyConstraint: 'The CEO values extreme operational rigor and dislikes theoretical management buzzwords.',
      starterTip: 'Anchor your pitch with one concrete past turnaround story and your repeatable framework.',
      customCriteria: 'Executive presence, structured MECE 30-60-90 day milestones, and zero abstract management speak.'
    },
    {
      title: 'High-Stakes Strategic Partnership Proposal',
      audience: 'Head of Strategic Partnerships at an Enterprise SaaS Giant',
      context: 'You are proposing an exclusive co-marketing and native workflow integration partnership that opens access to their 50,000 mid-market customers.',
      objective: 'Earn a technical scoping sprint and sign a reciprocal pilot agreement.',
      keyConstraint: 'They have a strong "not-invented-here" engineering bias and protect their customer base fiercely.',
      starterTip: 'Focus entirely on the unmet customer pain they currently ignore and why partnering is 5x faster than building.',
      customCriteria: 'Explain the distinct mutual benefit, customer retention lift for their platform, and time-to-market advantage.'
    }
  ]
};
