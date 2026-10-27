import { PitchMode, Scenario, ScenarioDifficulty } from '../types';

export const PRESET_SCENARIOS_BY_DIFFICULTY: Record<PitchMode, Record<ScenarioDifficulty, Scenario[]>> = {
  startup: {
    simple: [
      {
        title: 'Campus Coffee Delivery App',
        difficulty: 'simple',
        audience: 'Director of Campus Incubator & Student Grant Fund',
        context: 'You built an on-campus peer delivery app that lets students grab and deliver warm coffee to classmates between lecture halls in under 10 minutes.',
        objective: 'Convince the director to award your team a $5,000 campus pilot grant and permission to set up pickup kiosks.',
        keyConstraint: 'Director wants to make sure students won\'t be late to class delivering drinks.',
        starterTip: 'Hook them with a relatable 10-second morning student struggle before revealing your 400 active test orders.'
      },
      {
        title: 'Neighborhood Pet Sitting Co-op',
        difficulty: 'simple',
        audience: 'Local Small Business Angel Investor',
        context: 'A trusted neighborhood dog-walking and pet-sitting platform connecting verified pet owners with nearby neighbors, taking zero commissions on the first 3 bookings.',
        objective: 'Convince the investor that local neighbor trust and community vetting beats corporate platforms like Rover.',
        keyConstraint: 'Investor asks how you will guarantee pet safety and vet sitter backgrounds without high overhead.',
        starterTip: 'Start with the huge emotional relief pet owners feel when a friendly neighbor steps in.'
      },
      {
        title: 'Student Budget & Bill Splitter',
        difficulty: 'simple',
        audience: 'Collegiate Pitch Competition Judges',
        context: 'An ultra-simple mobile app that automatically splits apartment utility bills, groceries, and takeout without awkward Venmo reminders or calculations.',
        objective: 'Hook the judges on your viral campus growth loop and how 3 dorms adopted it organically in week one.',
        keyConstraint: 'Judges wonder why students wouldn\'t just use free calculators or spreadsheets.',
        starterTip: 'Lead with the uncomfortable roommate confrontation everyone has experienced over unpaid electricity bills.'
      }
    ],
    medium: [
      {
        title: 'Remote Team Onboarding Automation',
        difficulty: 'medium',
        audience: 'Seed Venture Partner at Work-Tech Fund',
        context: 'You built an automated interactive checklist platform that cuts remote engineer onboarding time from 3 weeks down to 3 days.',
        objective: 'Demonstrate 45% month-over-month pilot expansion across 12 mid-market tech companies and pitch your $750k seed round.',
        keyConstraint: 'Investor asks why companies will pay for a dedicated tool rather than using Notion or Slack bots.',
        starterTip: 'Lead with engineering salary dollars wasted during slow onboarding weeks.'
      },
      {
        title: 'Decarbonization Logistics Platform',
        difficulty: 'medium',
        audience: 'Climate Tech Lead at Breakthrough Energy Ventures',
        context: 'Automated freight route optimization and load bundling that reduces heavy trucking carbon emissions by 28% while saving 12% in diesel fuel costs.',
        objective: 'Prove the dual-incentive business case: shippers adopt it for immediate bottom-line fuel savings, and stay for ESG compliance.',
        keyConstraint: 'Freight shippers operate on razor-thin 3% margins and are notorious for slow 9-month sales cycles.',
        starterTip: 'Highlight rapid pilot payback period: carriers break even on software costs in under 45 days.'
      },
      {
        title: 'Contractor Instant Invoice Factoring',
        difficulty: 'medium',
        audience: 'Fintech Angel Investor Syndicate',
        context: 'A mobile factoring solution that pays freelance designers and software contractors 100% of their outstanding client invoices instantly for a transparent 2% flat fee.',
        objective: 'Hook investors with your proprietary automated bank-activity underwriting engine and request a $500k angel check.',
        keyConstraint: 'Angel is concerned about payment default risk if a contractor\'s client goes bankrupt.',
        starterTip: 'Contrast the 60-day Net payment nightmare with an instant payout notification.'
      }
    ],
    complex: [
      {
        title: 'DevOps Copilot Seed Round',
        difficulty: 'complex',
        audience: 'General Partner at a Top-Tier Seed Fund (First Round Capital)',
        context: 'Your team built an AI telemetry agent that detects and auto-patches production memory leaks in Kubernetes clusters before outages trigger.',
        objective: 'Hook the investor with your proprietary kernel-level moat, current traction ($35k MRR, 18% MoM), and the $2.5M round size.',
        keyConstraint: 'VC is skeptical of "yet another AI wrapper" and asks why Datadog won\'t build this by Q4.',
        starterTip: 'Lead with customer downtime cost and your unfair technical advantage at the eBPF layer.'
      },
      {
        title: 'Autonomous Clinical Scribe for ERs',
        difficulty: 'complex',
        audience: 'Healthcare Venture Partner at Bessemer',
        context: 'Emergency room physicians spend 2.5 hours per shift on EHR charting. Your ambient microphone solution generates certified Epic/Cerner notes with 99.4% billing accuracy.',
        objective: 'Convince the VC that your HIPAA-compliant workflow has zero doctor churn across 14 hospital trial wings.',
        keyConstraint: 'Hospitals have agonizing enterprise procurement and strict data privacy regulations.',
        starterTip: 'Contrast physician burnout statistics with concrete trial metric improvements.'
      },
      {
        title: 'Quantum-Resistant Encryption Gateway',
        difficulty: 'complex',
        audience: 'DeepTech Partner at Lux Capital',
        context: 'Hardware-accelerated post-quantum cryptographic primitives that secure high-frequency financial messaging pipelines against harvest-now-decrypt-later attacks.',
        objective: 'Lock in a $4M Series A lead check by validating your sub-15 microsecond latency benchmark.',
        keyConstraint: 'Sales cycles require rigorous compliance certifications and multi-stage institutional penetration tests.',
        starterTip: 'Anchor the pitch on regulatory urgency: NIST standards require post-quantum transitions by next year.'
      }
    ]
  },
  consulting: {
    simple: [
      {
        title: 'Local Bakery Weekend Bottleneck',
        difficulty: 'simple',
        audience: 'Consulting Club Case Leader / Interviewer',
        context: 'A popular local artisanal bakery has long lines out the door every Saturday morning, but revenue is actually falling because customers leave in frustration after 15 minutes.',
        objective: 'Deliver a crisp, structured 3-bucket diagnosis to streamline ordering, prep, and payment flow.',
        keyConstraint: 'The bakery owner has a tiny budget and cannot hire additional full-time staff.',
        starterTip: 'Structure your answer around Ordering Flow, Kitchen Prep Staging, and Mobile Pre-Orders.'
      },
      {
        title: 'Campus Gym Membership Drop-Off',
        difficulty: 'simple',
        audience: 'Case Interview Coach',
        context: 'A campus fitness facility sees a huge surge of student signups in September, but active visits drop by 60% by the first week of November.',
        objective: 'Present an easy-to-follow framework identifying why students quit and recommending two actionable retention programs.',
        keyConstraint: 'Keep your recommendations realistic for university students with varying class schedules.',
        starterTip: 'Use a clear MECE split: Scheduling Barriers, Motivation/Community, and Equipment Wait Times.'
      },
      {
        title: 'Independent Bookstore E-Commerce',
        difficulty: 'simple',
        audience: 'Small Business Strategy Advisor',
        context: 'A beloved neighborhood bookstore is losing book sales to national online retailers and wants a realistic plan to sell books online without losing its community warmth.',
        objective: 'Outline three prioritized revenue channels that leverage the staff\'s personalized curation.',
        keyConstraint: 'The store cannot compete on price or free two-day shipping.',
        starterTip: 'Focus on curated monthly book subscriptions, signed author editions, and community event bundles.'
      }
    ],
    medium: [
      {
        title: 'Meal Kit Subscription Churn',
        difficulty: 'medium',
        audience: 'Engagement Manager at Strategy Consulting Firm',
        context: 'A direct-to-consumer meal delivery service is experiencing an 8% monthly subscriber churn after the introductory promotional period ends.',
        objective: 'Lay out a MECE hypothesis-driven structure evaluating pricing tiers, recipe fatigue, and delivery reliability.',
        keyConstraint: 'You have only 60 seconds to state your core hypothesis and prioritized 3-pillar breakdown.',
        starterTip: 'Deliver a 10-second synthesis upfront before breaking into Customer Journey stages.'
      },
      {
        title: 'Regional Hospital Bed Capacity',
        difficulty: 'medium',
        audience: 'Healthcare Practice Leader',
        context: 'A 400-bed regional hospital is running at 94% occupancy, forcing emergency room patients to wait an average of 6 hours for an inpatient bed.',
        objective: 'Diagnose the operational drivers of delayed patient discharge and propose two quick-win workflow fixes.',
        keyConstraint: 'CapEx expansion is frozen; solutions must rely solely on process and scheduling optimization.',
        starterTip: 'Structure by Morning Discharge Protocols, Transportation Logistics, and Doctor Rounding Times.'
      },
      {
        title: 'Airline Loyalty Program Monetization',
        difficulty: 'medium',
        audience: 'Strategy Partner at Boston Consulting Group (BCG)',
        context: 'A major North American airline is evaluating whether to monetize or spin off its frequent flier loyalty program into an independent financial entity.',
        objective: 'Present your framework evaluating valuation upside vs airline brand dilution and customer retention risks.',
        keyConstraint: 'Do not get bogged down in math; provide a high-level strategic trade-off framework.',
        starterTip: 'Structure by Value Creation, Operational Feasibility, and Long-Term Risk Mitigation.'
      }
    ],
    complex: [
      {
        title: 'Omnichannel Retail Margin Decline',
        difficulty: 'complex',
        audience: 'Senior Engagement Manager at McKinsey & Company',
        context: 'A $4B national apparel retailer experienced a 350 bps gross margin contraction over the past three quarters despite a 6% revenue uptick.',
        objective: 'Lay out a MECE hypothesis-driven structure to diagnose whether the root cause is promotional discounting, return logistics, or supply chain inflation.',
        keyConstraint: 'You have only 60 seconds to state your core hypothesis and prioritized 3-pillar breakdown.',
        starterTip: 'Start with an executive summary sentence, then introduce your three mutually exclusive pillars.'
      },
      {
        title: 'Electric Vehicle Fleet Transition',
        difficulty: 'complex',
        audience: 'Principal at Bain & Company (Private Equity Group)',
        context: 'A portfolio company operating 12,000 regional delivery vans is considering transitioning 100% of its fleet to electric vehicles over 36 months.',
        objective: 'Outline the critical investment criteria: CapEx vs OpEx lifecycle TCO, charging grid infrastructure, and residual value risk.',
        keyConstraint: 'Grid capacity upgrades at 40% of depots require 18 months of municipal permitting.',
        starterTip: 'Frame around unit economics per route mile and depot power capacity readiness.'
      },
      {
        title: 'Semiconductor Fab Reshoring Feasibility',
        difficulty: 'complex',
        audience: 'Operations Strategy Director at Strategy&',
        context: 'A global microchip designer is evaluating a $12B greenfield fabrication plant in the United States under CHIPS Act subsidies.',
        objective: 'Deliver an executive briefing contrasting domestic fab operational yields and cleanroom labor costs with geopolitical supply chain resilience.',
        keyConstraint: 'Subsidies only cover 20% of CapEx, and local specialized engineer shortages threaten a 2-year delay.',
        starterTip: 'Lead with the critical risk trade-off: geopolitical continuity versus ongoing unit cost parity.'
      }
    ]
  },
  elevator: {
    simple: [
      {
        title: 'Student Mentorship Connect',
        difficulty: 'simple',
        audience: 'University Alumni Association President',
        context: 'You share an elevator with the alumni president after a university leadership panel.',
        objective: 'Deliver a warm, concise 45-second hook proposing a pilot program where young alumni host 15-minute virtual coffee chats with undergrads.',
        keyConstraint: 'The elevator ride takes only 40 seconds before they step out on the lobby floor.',
        starterTip: 'Mention how easily alumni can give back 15 minutes from their phone without financial commitment.'
      },
      {
        title: 'Local Farmers Market Pickup Box',
        difficulty: 'simple',
        audience: 'Neighborhood Grocery Store Owner',
        context: 'You run into a local grocery store owner at a neighborhood community council coffee hour.',
        objective: 'Pitch placing a temperature-controlled locker in their storefront where local families pick up weekly organic farm produce boxes.',
        keyConstraint: 'The owner is wary of cluttering their front entrance and taking business away from their produce aisle.',
        starterTip: 'Highlight how farm-box pickups bring 50+ guaranteed weekly shoppers directly through their doors.'
      },
      {
        title: 'Team Standup Timer App',
        difficulty: 'simple',
        audience: 'Engineering Team Lead at a Local Tech Meetup',
        context: 'You are chatting by the refreshment table during a 2-minute break at a local tech meetup.',
        objective: 'Pitch your lightweight browser audio timer that keeps daily agile standups strictly under 10 minutes with pleasant chime nudges.',
        keyConstraint: 'They are heading back to their seat in 30 seconds.',
        starterTip: 'Open with the universal frustration of 15-minute standups that drag into 45-minute lectures.'
      }
    ],
    medium: [
      {
        title: 'B2B Procurement Intelligence',
        difficulty: 'medium',
        audience: 'Chief Procurement Officer of Boeing',
        context: 'You sit next to each other on a red-eye flight from Seattle to Chicago waiting for takeoff.',
        objective: 'Explain how real-time Tier-2 supplier financial health telemetry prevents sole-source manufacturing shutdowns.',
        keyConstraint: 'Be conversational, respectful, and authoritative without sounding like an aggressive telemarketer.',
        starterTip: 'Speak directly to the nightmare of unannounced supplier insolvencies during peak production.'
      },
      {
        title: 'Remote Employee Wellness Stipend',
        difficulty: 'medium',
        audience: 'VP of People Operations at a 500-person SaaS company',
        context: 'Waiting in line at a tech conference coffee bar before the morning keynote.',
        objective: 'Pitch a flexible corporate benefits card with 100% automated receipt auditing and zero tax compliance headaches.',
        keyConstraint: 'They are checking their watch and have only 45 seconds before the keynote doors close.',
        starterTip: 'Ask if their HR team still spends 20 hours a month manually verifying gym receipts.'
      },
      {
        title: 'Instant Sales Call Recap Videos',
        difficulty: 'medium',
        audience: 'VP of Commercial Sales',
        context: 'Sharing an elevator ride after a B2B sales summit.',
        objective: 'Hook them on an automated agent that turns 30-minute Zoom sales calls into personalized 60-second video recaps sent to prospects within 5 minutes.',
        keyConstraint: 'The elevator reaches the lobby in 35 seconds.',
        starterTip: 'Lead with the fact that sales response rates drop 80% if follow-ups take longer than 2 hours.'
      }
    ],
    complex: [
      {
        title: 'Fintech Fraud Prevention Hook',
        difficulty: 'complex',
        audience: 'Chief Risk Officer of a Top-5 Global Retail Bank',
        context: 'You share an elevator going up to the 40th floor at the annual Sibos banking conference.',
        objective: 'Deliver an unforgettable 45-second hook on how your graph-neural-network engine catches synthetic identity fraud before funds leave the wire.',
        keyConstraint: 'The elevator chime sounds at floor 20—you have under 30 seconds left to lock in a follow-up briefing.',
        starterTip: 'Use a startling metric: "Banks lost $4.8B to synthetic identities last year because legacy rules inspect single accounts in isolation."'
      },
      {
        title: 'Enterprise Cyber Zero-Trust',
        difficulty: 'complex',
        audience: 'Chief Information Security Officer (CISO) of Pfizer',
        context: 'You run into the CISO at an exclusive cyber briefing coffee bar before their keynote address.',
        objective: 'Pitch your automated secret-rotation and identity governance platform that eliminates developer credential sprawl across hybrid clouds.',
        keyConstraint: 'They are looking at their watch and are surrounded by two conference security handlers.',
        starterTip: 'Acknowledge their limited time immediately and ask for a 15-minute briefing with their VP of Identity.'
      },
      {
        title: 'High-Frequency Network Gateway',
        difficulty: 'complex',
        audience: 'Managing Director of Electronic Trading at Citadel',
        context: 'Passing through an airport executive lounge before a flight to Chicago.',
        objective: 'Hook them on custom FPGA-accelerated network interface cards that shave 45 nanoseconds off tick-to-trade execution.',
        keyConstraint: 'They are extremely skeptical of unverified performance claims and hate buzzwords.',
        starterTip: 'Quote your deterministic latency benchmark under 99.9th percentile market volatility spikes.'
      }
    ]
  },
  freestyle: {
    simple: [
      {
        title: 'Pitching a Weekly Team Learning Hour',
        difficulty: 'simple',
        audience: 'Your Direct Engineering or Project Manager',
        context: 'You want to establish a weekly 45-minute peer knowledge share where team members demo useful tools, productivity tricks, and project learnings.',
        objective: 'Convince your manager to approve a 4-week trial run starting next Friday.',
        keyConstraint: 'Manager is worried about meeting sprint deadlines and team bandwidth.',
        starterTip: 'Emphasize that sharing bug fixes and automation scripts saves the team hours every week.',
        customCriteria: 'Clear personal tone, practical scheduling, and addressing bandwidth concerns with a 4-week low-risk trial.'
      },
      {
        title: 'Student Club Project Funding',
        difficulty: 'simple',
        audience: 'Campus Student Activities Board Treasurer',
        context: 'You are pitching a $300 budget request to purchase pizza and art supplies for a campus mental health decompression workshop during finals week.',
        objective: 'Secure full funding approval on the spot.',
        keyConstraint: 'Board has a limited remaining budget and needs to justify every dollar to student affairs.',
        starterTip: 'Paint a clear picture of expected student attendance and the positive campus impact.',
        customCriteria: 'Transparent budget breakdown, clear student turnout estimate, and low-cost execution plan.'
      },
      {
        title: 'Proposing a New Collaboration Tool',
        difficulty: 'simple',
        audience: 'Department Team Lead',
        context: 'Your team currently coordinates projects across scattered email threads and confusing spreadsheets. You found an intuitive free visual board tool.',
        objective: 'Convince your team lead to run a 2-week pilot with your subteam.',
        keyConstraint: 'Team lead has had bad experiences with complicated software transitions in the past.',
        starterTip: 'Reassure them that zero training is required and the free tier covers your entire team.',
        customCriteria: 'Relatable pain points, zero setup cost emphasis, and minimal disruption promise.'
      }
    ],
    medium: [
      {
        title: 'Sales Demo Hook for Mid-Market HR',
        difficulty: 'medium',
        audience: 'Director of Talent Acquisition',
        context: 'Opening 60 seconds of a scheduled discovery call with a 300-employee company.',
        objective: 'Convince the director to commit to a 20-minute product walkthrough next Tuesday.',
        keyConstraint: 'Prospect has already evaluated two competing applicant tracking systems this quarter.',
        starterTip: 'Focus on candidate drop-off rate and mobile application completion speed.',
        customCriteria: 'Compelling opening hook, clear point of differentiation, and frictionless call to action.'
      },
      {
        title: 'Internal AI Tooling Budget Request',
        difficulty: 'medium',
        audience: 'VP of Engineering and CFO',
        context: 'Pitching an internal developer platform migration to reduce build bottlenecks and AWS compute overhead.',
        objective: 'Secure approval for a 6-month trial budget ($120k) and 2 dedicated sprint cycles.',
        keyConstraint: 'CFO is enforcing strict cost freezes across all software tooling this quarter.',
        starterTip: 'Quantify developer hours lost per month against direct annual compute savings.',
        customCriteria: 'Quantified ROI within 6 months, clear milestone roadmap, and zero downtime risk.'
      },
      {
        title: 'Strategic Channel Partnership',
        difficulty: 'medium',
        audience: 'Head of Business Development at SaaS Ecosystem',
        context: 'Proposing an exclusive co-marketing and native workflow integration partnership that opens access to their 20,000 mid-market users.',
        objective: 'Earn a technical scoping sprint and sign a reciprocal pilot agreement.',
        keyConstraint: 'They have a strong "not-invented-here" engineering bias and protect customer trust fiercely.',
        starterTip: 'Focus entirely on the unmet customer pain they currently ignore and why partnering is 5x faster than building.',
        customCriteria: 'Mutual retention value, clear competitive moat, and rapid time-to-market advantage.'
      }
    ],
    complex: [
      {
        title: 'Executive Role Final Interview Story',
        difficulty: 'complex',
        audience: 'CEO and Lead Board Director',
        context: 'Final interview stage for a VP / Head of Operations role at a high-growth scale-up.',
        objective: 'Articulate your 90-day turnaround strategy to reduce cross-departmental delivery friction and scale execution.',
        keyConstraint: 'The CEO values extreme operational rigor and dislikes theoretical management buzzwords.',
        starterTip: 'Anchor your pitch with one concrete past turnaround story and your repeatable framework.',
        customCriteria: 'Executive presence, structured MECE 30-60-90 day milestones, and zero abstract management speak.'
      },
      {
        title: 'Series B Capital Allocation Plan',
        difficulty: 'complex',
        audience: 'Lead Partner at Growth Venture Syndicate',
        context: 'Defending your financial model for a $20M Series B expansion into European enterprise accounts.',
        objective: 'Convince the investment committee that your Net Revenue Retention (134%) justifies aggressive sales hiring.',
        keyConstraint: 'Macro environment favors profitability over pure growth; committee demands a 18-month path to cash-flow breakeven.',
        starterTip: 'Lead with customer payback period (8 months) and expansion cohort retention.',
        customCriteria: 'Rigorous unit economics, clear burn multiple defense, and phased hiring milestones.'
      },
      {
        title: 'High-Stakes M&A Divestiture Rationale',
        difficulty: 'complex',
        audience: 'Board of Directors Audit & Risk Committee',
        context: 'Recommending the tax-free spin-off of a legacy enterprise software subsidiary with declining EBITDA margins.',
        objective: 'Secure board consensus to engage investment bankers for an auction process.',
        keyConstraint: 'Two legacy board members hold sentimental attachment to the founding subsidiary.',
        starterTip: 'Contrast the subsidiary\'s drag on valuation multiples with the unlocked shareholder value of a pure-play growth story.',
        customCriteria: 'Fiduciary clarity, valuation multiple arbitrage analysis, and strategic risk mitigation.'
      }
    ]
  }
};

/**
 * Get presets filtered by mode and difficulty. Defaults to 'simple' if not specified.
 */
export function getPresets(mode: PitchMode, difficulty: ScenarioDifficulty = 'simple'): Scenario[] {
  const modePresets = PRESET_SCENARIOS_BY_DIFFICULTY[mode] || PRESET_SCENARIOS_BY_DIFFICULTY.startup;
  return modePresets[difficulty] || modePresets.simple;
}

/**
 * Backward compatibility: DEFAULT_SCENARIOS provides a flat list for each mode,
 * ordered with simple (beginner-friendly) first.
 */
export const DEFAULT_SCENARIOS: Record<PitchMode, Scenario[]> = {
  startup: [
    ...PRESET_SCENARIOS_BY_DIFFICULTY.startup.simple,
    ...PRESET_SCENARIOS_BY_DIFFICULTY.startup.medium,
    ...PRESET_SCENARIOS_BY_DIFFICULTY.startup.complex,
  ],
  consulting: [
    ...PRESET_SCENARIOS_BY_DIFFICULTY.consulting.simple,
    ...PRESET_SCENARIOS_BY_DIFFICULTY.consulting.medium,
    ...PRESET_SCENARIOS_BY_DIFFICULTY.consulting.complex,
  ],
  elevator: [
    ...PRESET_SCENARIOS_BY_DIFFICULTY.elevator.simple,
    ...PRESET_SCENARIOS_BY_DIFFICULTY.elevator.medium,
    ...PRESET_SCENARIOS_BY_DIFFICULTY.elevator.complex,
  ],
  freestyle: [
    ...PRESET_SCENARIOS_BY_DIFFICULTY.freestyle.simple,
    ...PRESET_SCENARIOS_BY_DIFFICULTY.freestyle.medium,
    ...PRESET_SCENARIOS_BY_DIFFICULTY.freestyle.complex,
  ],
};
