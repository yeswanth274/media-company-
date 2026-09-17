import os
import sys
from pathlib import Path

# Add backend root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from app.database.database import init_database
from app.ingestion.loader import DocumentLoader
from app.utils.config import settings
from app.utils.logging import logger

SAMPLE_DOCUMENTS = [
    # 1. Article 1 (2015) - Foundation & Market Entry
    {
        "filename": "article_2015_northstar_launch.md",
        "title": "Northstar Technologies Unveils Autonomous Sensor Array for Municipal Infrastructure",
        "source_type": "article",
        "publication": "Metro Daily",
        "author": "Sarah Jenkins",
        "publication_date": "2015-09-14",
        "location": "Metro City",
        "description": "Initial reporting on Northstar Technologies unveiling their proprietary LIDAR and telemetry grid.",
        "content": """# Northstar Technologies Unveils Autonomous Sensor Array for Municipal Infrastructure

**By Sarah Jenkins | Metro Daily | September 14, 2015**

METRO CITY — Emerging smart-city startup Northstar Technologies announced today the commercial launch of its flagship municipal telemetry platform, dubbed 'Project Apex.' Founded by tech entrepreneur Alex Morgan, the firm claims its networked sensor arrays can reduce municipal traffic bottlenecks by 35% and monitor structural integrity across bridges and public transit corridors in real time.

"Our mission is to bring high-precision data infrastructure to public utilities before critical failures occur," Alex Morgan stated during a press briefing at the Metro Convention Center. "With our patented optical-inertial sensors, cities can diagnose infrastructure stress months before visible cracks appear."

Municipal transit commissioner Raymond Holt confirmed that Metro City has approved a preliminary $4.2 million pilot deployment along the central transit corridor scheduled to commence in spring 2016. Industry analysts view the contract as a major validation of Northstar's predictive infrastructure models."""
    },

    # 2. Article 2 (2016) - Expansion
    {
        "filename": "article_2016_regional_expansion.txt",
        "title": "Northstar Technologies Enters Regional Market with $22 Million Capital Round",
        "source_type": "article",
        "publication": "Regional Tribune",
        "author": "David Chen",
        "publication_date": "2016-06-20",
        "location": "Oakridge",
        "description": "Coverage of Northstar's Series B expansion and multi-city rollouts.",
        "content": """NORTHSTAR TECHNOLOGIES ENTERS REGIONAL MARKET WITH $22 MILLION CAPITAL ROUND
By David Chen, Regional Tribune
Published June 20, 2016

OAKRIDGE — Northstar Technologies announced Monday that it has secured $22 million in Series B financing led by Crestview Ventures, accelerating its regional rollout across four neighboring municipalities.

The expansion comes as Northstar completes the initial phase of its Metro City deployment. According to company filings, the firm's sensor arrays are now active on 180 transit nodes. Founder and CEO Alex Morgan announced the opening of a dedicated regional engineering center in Oakridge, expecting to hire 120 hardware engineers and software specialists over the next eighteen months.

However, municipal union representatives have voiced mild skepticism regarding data ownership and maintenance protocols, demanding third-party verification of sensor telemetry reliability."""
    },

    # 3. Article 3 (2018) - The Investigation Begins (Note: Date conflict: April 2018)
    {
        "filename": "article_2018_investigation_launch.html",
        "title": "City Audits Launch Inquiry into Northstar Sensor Reliability Following Internal Whistleblower Dossier",
        "source_type": "article",
        "publication": "Metro Daily",
        "author": "Sarah Jenkins",
        "publication_date": "2018-04-12",
        "location": "Metro City",
        "description": "Metro Daily breaks news that the formal municipal investigation began in April 2018.",
        "content": """<!DOCTYPE html>
<html>
<head><title>City Audits Launch Inquiry into Northstar Sensor Reliability</title></head>
<body>
<h1>City Audits Launch Inquiry into Northstar Sensor Reliability Following Whistleblower Dossier</h1>
<p><em>By Sarah Jenkins, Metro Daily — April 12, 2018</em></p>
<p>METRO CITY — The municipal oversight committee initiated a formal probe into Northstar Technologies this morning, following allegations that the company's autonomous sensor arrays have suffered from systematic calibration drift and suppressed warning reports.</p>
<p>According to city procurement records obtained under freedom of information requests, the formal municipal investigation began in April 2018 following the receipt of an internal engineering dossier detailing telemetry discrepancies across three bridge monitoring hubs.</p>
<p>Chief Investigator Patricia Vance confirmed that the probe will examine potential contract non-compliance and investigate whether safety-critical telemetry was obscured during regulatory inspections. Northstar representatives categorically denied intentional data manipulation, releasing a statement asserting that all hardware meets municipal safety thresholds.</p>
</body>
</html>"""
    },

    # 4. Article 4 (2021) - Regulatory Settlement (Note: Conflict: $42M penalty)
    {
        "filename": "article_2021_regulatory_action.md",
        "title": "State Regulator Imposes $42 Million Penalty on Northstar Technologies Over Omitted Calibration Logs",
        "source_type": "article",
        "publication": "Financial Observer",
        "author": "Marcus Sterling",
        "publication_date": "2021-11-08",
        "location": "State Capital",
        "description": "Financial Observer report stating the 2021 regulatory penalty was $42 million with mandated compliance monitors.",
        "content": """# State Regulator Imposes $42 Million Penalty on Northstar Technologies Over Omitted Calibration Logs

**By Marcus Sterling | Financial Observer | November 8, 2021**

STATE CAPITAL — Following a three-year multi-agency investigation, the State Department of Commerce and Infrastructure Safety Board announced a comprehensive regulatory enforcement action against Northstar Technologies, levying a $42 million civil monetary penalty.

The enforcement order concludes that between 2016 and 2019, Northstar failed to disclose critical optical sensor drift in quarterly compliance certifications submitted to five municipal transit districts. In addition to the $42 million fine, Northstar must submit to an independent engineering compliance monitor for a period of four years.

"Public trust demands uncompromised telemetry standards when public safety infrastructure is at stake," said State Enforcement Director Clara Oswald during Monday's press conference. Northstar's board of directors approved the settlement without admitting guilt."""
    },

    # 5. Article 5 (2025) - Restructuring & Legacy
    {
        "filename": "article_2025_ten_year_retrospective.md",
        "title": "A Decade in the Crosshairs: How Northstar Technologies Rebuilt Its Hardware Stack After the Scandal",
        "source_type": "article",
        "publication": "Metro Daily",
        "author": "Sarah Jenkins & Liam O'Connor",
        "publication_date": "2025-03-02",
        "location": "Metro City",
        "description": "Ten-year retrospective analyzing the structural reforms, leadership changes, and lasting impact on public infrastructure.",
        "content": """# A Decade in the Crosshairs: How Northstar Technologies Rebuilt Its Hardware Stack After the Scandal

**By Sarah Jenkins & Liam O'Connor | Metro Daily | March 2, 2025**

Ten years after Northstar Technologies first won municipal contracts in Metro City, the firm presents a radically transformed posture. Under current chief executive Dr. Aris Thorne, who replaced founder Alex Morgan in late 2022, the company has open-sourced its core calibration verification algorithms and established automated cryptographic telemetry audits.

"The lessons of the 2018 investigation and the subsequent regulatory enforcement permanently altered how our engineering organization approaches safety-critical telemetry," Dr. Thorne remarked in an exclusive interview. 

Archival records reveal that Northstar's historical controversies spurred widespread legislative reforms across municipal procurement boards, establishing mandatory third-party verification for all AI-assisted public infrastructure sensors."""
    },

    # 6. Interview 1 (2018) - Whistleblower Elena Rostova (Note: Conflict: says internal review began in January 2018)
    {
        "filename": "interview_2018_elena_rostova_whistleblower.txt",
        "title": "Interview with Elena Rostova, Former Lead Calibration Engineer at Northstar Technologies",
        "source_type": "interview",
        "publication": "Metro Investigative Quarterly",
        "author": "Liam O'Connor",
        "publication_date": "2018-05-19",
        "location": "Metro City",
        "description": "In-depth interview with whistleblower Elena Rostova on early internal audits and suppression of sensor drift.",
        "content": """INTERVIEW TRANSCRIPT: ELENA ROSTOVA
Conducted by Liam O'Connor, Metro Investigative Quarterly
Date: May 19, 2018 | Location: Off-the-record secure facility

[00:04:12] Liam O'Connor: Elena, thank you for agreeing to speak with us. When did you first detect anomalies in the Apex sensor telemetry?

[00:04:30] Elena Rostova: It was late autumn 2017 when we were testing the third-generation optical sensors in the damp environmental chambers. We observed persistent sensor drift exceeding 14% after continuous 90-day cycles. When I raised this with senior management, I was told it was a statistical artifact.

[00:08:45] Liam O'Connor: Public reporting from Metro Daily indicated that the investigation began in April 2018. Is that when internal leadership first reacted?

[00:09:05] Elena Rostova: No, that timeline is inaccurate regarding internal knowledge. Our internal engineering audit began in January 2018, nearly four months before the city announced its probe. In January 2018, our internal quality committee drafted a 60-page red-flag report directly delivered to Alex Morgan and CFO Marcus Vance. The executive team decided to handle it quietly rather than notify municipal partners.

[00:15:20] Liam O'Connor: What happened after you submitted the red-flag memo?

[00:15:40] Elena Rostova: Within three weeks, my team's administrative database access was restricted, and calibration logs were routed through executive review before being archived. That is when I realized external regulatory disclosure was the only ethical path left."""
    },

    # 7. Interview 2 (2019) - CEO Alex Morgan's Defense (Note: Claims executives were unaware until late 2018)
    {
        "filename": "interview_2019_alex_morgan_defense.txt",
        "title": "Exclusive Interview: Alex Morgan on Northstar's Controversies, Audit Reports, and Future Plans",
        "source_type": "interview",
        "publication": "Tech & Capital Review",
        "author": "Rachel Green",
        "publication_date": "2019-02-10",
        "location": "San Francisco",
        "description": "Founder Alex Morgan claims executive leadership was unaware of hardware defects until late 2018.",
        "content": """TECH & CAPITAL REVIEW: INTERVIEW WITH ALEX MORGAN
Interviewer: Rachel Green
Publication Date: February 10, 2019

[00:02:15] Rachel Green: Alex, municipal prosecutors and press reports have cast severe doubt on Northstar's telemetry validation. How do you respond to allegations of intentional suppression?

[00:02:40] Alex Morgan: The narrative being constructed in the press is fundamentally misinformed. Executive leadership was completely unaware of any systemic calibration discrepancies until late 2018, when external municipal audit preliminary reports were shared with our board. As soon as reliable data was presented, we cooperated transparently.

[00:06:10] Rachel Green: Former engineers claim they warned you directly in January 2018.

[00:06:35] Alex Morgan: We received dozens of technical memorandums daily. The preliminary notes from early 2018 were conflicting internal engineering disagreements, not verified product defects. We acted on the basis of sound engineering consensus at all times. Our hardware has never caused a single structural failure.

[00:12:50] Rachel Green: What is your financial outlook following the cancellations of municipal renewals?

[00:13:10] Alex Morgan: Northstar maintains strong institutional backing and a cash reserve exceeding $40 million. We are confident our re-engineered Apex-IV architecture will surpass all regulatory benchmarks."""
    },

    # 8. Interview 3 (2023) - Former CFO Marcus Vance
    {
        "filename": "interview_2023_marcus_vance_cfo.txt",
        "title": "Interview: Marcus Vance Reflects on Financial Decisions at Northstar Technologies",
        "source_type": "interview",
        "publication": "Business Ethics Journal",
        "author": "David Chen",
        "publication_date": "2023-08-15",
        "location": "Chicago",
        "description": "Former CFO Marcus Vance discusses executive deliberations, capital pressures, and internal audit reviews.",
        "content": """BUSINESS ETHICS JOURNAL: EXECUTIVE PERSPECTIVES
Interview with Marcus Vance, Former CFO of Northstar Technologies
Conducted by David Chen | August 15, 2023

[00:05:10] David Chen: Mr. Vance, looking back at the 2018-2021 period, what financial pressures dictated company strategy?

[00:05:35] Marcus Vance: In 2017 and 2018, Northstar was preparing for a potential initial public offering. Any public acknowledgment of hardware recall or sensor recalibration across tens of thousands of deployed units would have decimated our valuation and triggered debt covenants.

[00:11:20] David Chen: Did executive leadership review the January 2018 engineering dossier?

[00:11:45] Marcus Vance: Yes. The executive committee, including Alex Morgan and myself, received Elena Rostova's report on January 18, 2018. We spent three consecutive board sessions debating whether to issue a voluntary recall or patch the telemetry through over-the-air firmware updates. The decision was made to attempt software dampening first to avoid municipal panic."""
    },

    # 9. Transcript 1 (2016) - Board Meeting (Note: Contradicts Alex Morgan's 2019 claims)
    {
        "filename": "transcript_2016_board_meeting.md",
        "title": "Confidential Transcript: Northstar Technologies Executive Board Meeting (October 2016)",
        "source_type": "transcript",
        "publication": "Corporate Archive / Subpoenaed Exhibit B",
        "author": "Corporate Secretary Office",
        "publication_date": "2016-10-18",
        "location": "Northstar Headquarters",
        "description": "Subpoenaed executive board meeting transcript proving executive knowledge of early calibration anomalies in 2016.",
        "content": """# NORTHSTAR TECHNOLOGIES INC. — EXECUTIVE BOARD MEETING TRANSCRIPT
**Date: October 18, 2016 | Classified / Subpoena Exhibit B**
**Attendees: Alex Morgan (CEO), Marcus Vance (CFO), Dr. Julian Sterling (VP R&D), Diane Foster (General Counsel)**

[00:14:20] Alex Morgan: Let us move to agenda item three: the preliminary telemetry reports from the Metro City transit corridor. Julian, walk us through the drift metrics.

[00:15:05] Dr. Julian Sterling: We are seeing an unexpected thermal drift on the optical lenses in high-humidity conditions. The variance is roughly 8% beyond our published operational tolerances. It does not cause catastrophic false positives, but over a 12-month window, the predictive wear curve becomes unreliable.

[00:16:40] Alex Morgan: We cannot afford a public re-calibration campaign during our Series B expansion. Diane, what are our disclosure obligations under the municipal contract?

[00:17:15] Diane Foster: The contract requires disclosure of 'material defects impacting safety operations.' If we classify this as an ongoing calibration refinement rather than a hardware defect, disclosure is discretionary.

[00:18:00] Alex Morgan: Then we classify it as routine telemetry tuning. Julian, instruct the firmware team to adjust the baseline algorithm to dampen the drift curve in public dashboards."""
    },

    # 10. Transcript 2 (2021) - Municipal City Council Hearing
    {
        "filename": "transcript_2021_city_council_hearing.txt",
        "title": "Official Transcript: Metro City Council Oversight Hearing on Municipal Telemetry Contracts",
        "source_type": "transcript",
        "publication": "City Record of Metro City",
        "author": "Metro City Council Secretariat",
        "publication_date": "2021-04-05",
        "location": "City Hall, Council Chambers",
        "description": "Council hearing questioning transit officials and independent investigators regarding contract renewals and telemetry audits.",
        "content": """METRO CITY COUNCIL OVERSIGHT COMMITTEE
HEARING ON SMART CITY INFRASTRUCTURE CONTRACTS
Official Record — April 5, 2021

Chairwoman Helen Brooks: The committee will come to order. We are reviewing the municipal performance of Northstar Technologies sensor systems deployed under Contract #2015-TX-99. Chief Inspector Vance, what are your investigative conclusions?

Chief Inspector Patricia Vance: Our audit examined 450 municipal sensor nodes deployed between 2016 and 2020. The findings confirm that 28% of telemetry logs submitted to the transit authority exhibited manual baseline adjustments that masked sensor degradation.

Councilman Jeffrey Ross: Was there any recorded instance where bridge or transit structural integrity was compromised without detection?

Chief Inspector Patricia Vance: Physical inspections by state structural engineers confirmed that the underlying civil infrastructure remained structurally sound. However, the early-warning telemetry system for which taxpayers paid $14.8 million did not perform as represented, creating an unacceptable margin of unmonitored risk.

Chairwoman Helen Brooks: This committee recommends total contract termination and referral to the State Attorney General for civil restitution proceedings."""
    },

    # 11. Footage Note 1 (2018) - Press Conference & Stakeout
    {
        "filename": "footage_note_2018_city_hall_stakeout.md",
        "title": "Archival Footage Log & Reporter Notes: Metro City Hall Press Conference on Northstar Audit",
        "source_type": "footage_note",
        "publication": "Metro Daily Video Archive",
        "author": "Field Producer Karen Adams",
        "publication_date": "2018-04-12",
        "location": "Metro City Hall Steps",
        "description": "Field notes, unedited B-roll timecodes, and on-scene reporter observations from the 2018 press briefing.",
        "content": """# ARCHIVAL FOOTAGE LOG: METRO CITY HALL STAKEOUT (TAPE ID: MD-2018-0412-B)
**Date: April 12, 2018 | Camera: Sony PMW-500 | Field Producer: Karen Adams**

[00:00:15 - 00:03:40] B-Roll: Wide shots of Metro City Hall entrance. Arriving city council members and investigative staff carrying black binders labeled 'Northstar Audit Vol. 1-4.'

[00:05:22 - 00:11:15] Press Conference: City Inspector Patricia Vance stepping up to the podium with Mayor's Chief of Staff. Vance announces commencement of comprehensive operational inquiry into Northstar telemetry integrity.

[00:11:30 - 00:14:02] Scramble on the steps: Reporter Sarah Jenkins asks Vance: "Did whistleblower memos reach city officials prior to this month?" Vance pauses, checks notes, replies: "The formal evidence was delivered to my desk on April 3rd."

[00:14:50 - 00:18:30] Stakeout outside Northstar Regional Office: B-roll of employees leaving building. Founder Alex Morgan seen exiting through rear parking garage at 17:45, declining microphone questions with brief statement: "Our team will cooperate fully with technical reviews." """
    },

    # 12. Footage Note 2 (2021) - Settlement Announcement (Note: Conflict: $28M consent decree reported by Regional Tribune note)
    {
        "filename": "footage_note_2021_state_settlement_briefing.txt",
        "title": "Field Audio & Footage Notes: State Department of Commerce Settlement Briefing",
        "source_type": "footage_note",
        "publication": "Regional Broadcast Network Archive",
        "author": "Audio Engineer Tom Miller",
        "publication_date": "2021-11-08",
        "location": "State Capital Press Gallery",
        "description": "Footage notes documenting conflicting statements on whether settlement was $42 million fine vs $28 million consent decree.",
        "content": """REGIONAL BROADCAST NETWORK — FIELD NOTES (ARCHIVE #RBN-2021-1108)
Event: State Commerce & Infrastructure Board Press Briefing
Date: November 8, 2021 | Location: State Press Gallery
Recorded by: Tom Miller, Audio Ops

[00:01:10] State Enforcement Director Clara Oswald opens briefing detailing multi-agency resolution with Northstar Technologies.
[00:04:30] Oswald announces $42 million total monetary settlement, consisting of $28 million in civil penalties to the state infrastructure trust fund and $14 million in direct municipal telemetry replacement credits.
[00:08:15] Reporter Q&A: Financial Observer notes discrepancy with earlier Regional Tribune wire report that referenced only a $28 million consent decree without replacement credits. Oswald clarifies that the total settlement package totals $42 million when factoring in hardware restitution credits.
[00:12:00] B-roll of Northstar legal counsel Diane Foster reading brief statement confirming company agreement to settlement without admission of liability."""
    }
]

def seed_archive():
    logger.info("Starting seed process for Newsroom Intelligence archive...")
    init_database()

    docs_dir = Path(settings.DOCUMENTS_DIR)
    docs_dir.mkdir(parents=True, exist_ok=True)

    created_docs = []
    for doc_info in SAMPLE_DOCUMENTS:
        file_path = docs_dir / doc_info["filename"]
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(doc_info["content"])

        logger.info(f"Written sample file: {file_path.name}")

        try:
            doc_record = DocumentLoader.ingest_file(
                file_path=str(file_path),
                title=doc_info["title"],
                source_type=doc_info["source_type"],
                publication=doc_info["publication"],
                author=doc_info["author"],
                publication_date=doc_info["publication_date"],
                location=doc_info["location"],
                description=doc_info["description"]
            )
            created_docs.append(doc_record)
            logger.info(f"Ingested: [{doc_record.source_type.upper()}] '{doc_record.title}' (ID: {doc_record.id})")
        except Exception as e:
            logger.error(f"Failed to ingest {doc_info['filename']}: {e}")

    logger.info(f"Archive seeding complete! Ingested {len(created_docs)} documents.")

if __name__ == "__main__":
    seed_archive()
