# OrGanap — Requirements Specification

> Source: OrGanap_Requirements_Specification.docx
> Transcribed for agent reference and architecture planning.

OrGanap: A Student Organization Event Approval and Attendance Management System

1. PROJECT DESCRIPTION

System Description

OrGanap is a proposed web-based information system for managing student organization event proposals, approval decisions, registrations, and attendance within one school or university. It would provide a shared platform for student organization officers, faculty advisers, Student Affairs personnel, and student attendees. School management and authorized information technology personnel would serve as supporting stakeholders. The system addresses the difficulty of coordinating events when proposals, decisions, schedules, and attendance records are maintained through separate documents and communication channels.

The assumed existing process involves organization officers preparing event proposals, obtaining adviser endorsement, and requesting approval from Student Affairs. Coordination may occur through printed forms, email, messaging applications, or spreadsheets, while attendance may be recorded using sign-in sheets or separate online forms. This fragmented approach may make it difficult to identify the latest proposal version, track approval status, communicate revisions, check venue conflicts, and consolidate attendance records. Repeated manual encoding may also result in missing or duplicate entries. OrGanap would centralize these activities by providing a consistent process for submitting, reviewing, revising, and approving proposals. It would also prevent approval of overlapping events using the same venue, provide authorized access to event details and review decisions, maintain organized registration and attendance records, and generate reports while protecting student information. Expected benefits include clearer approval tracking, more consistent records, fewer venue conflicts, and easier report preparation.

The proposed scope covers recognized student organizations within one institution, a two-stage approval process, student registration, digital attendance recording, and event reporting. Faculty advisers would endorse proposals before Student Affairs grants final approval. Approved events would become available for student viewing and registration, while authorized organizers would record attendance and generate reports. Payment processing, external ticket sales, academic grading, learning management, and unrelated school operations are outside the scope. The institution would supply valid organization, account, adviser-assignment, and venue information. The project is constrained by the time and resources of a two-member team, while a future implementation would depend on internet connectivity, suitable devices, hosting, and institutional approval of the proposed procedures.

System inputs would include event proposal details, user accounts, review decisions, registration requests, and attendance confirmations. These inputs would undergo validation, approval routing, conflict checking, registration, attendance recording, and report preparation. Outputs would include proposal status records, approved event listings, registration confirmations, attendance records, and downloadable reports. To validate the proposed system, the team plans to interview organization officers, a faculty adviser, and Student Affairs personnel; review available event request forms and policies; and examine sample records with permission. The resulting information would help refine the assumed workflow and confirm the system requirements.

2. Part A: System Overview and Problem Analysis

A.1. Problem Analysis and System Necessity

The central problem addressed by OrGanap is the possible separation of event approval information from event participation records. An organization may maintain its proposal in one document, receive approval through another channel, announce the event elsewhere, and collect attendance using a separate tool. This arrangement can make it difficult to establish a complete and reliable record of an event.

Approval transparency is particularly important because organization officers need to know whether their proposal is awaiting adviser review, awaiting final approval, or requiring revision. Faculty advisers and Student Affairs personnel also need access to the same proposal details and previous decisions.

Attendance management introduces another requirement: organizers must distinguish students who registered from those who actually attended. Registration therefore does not automatically constitute attendance. OrGanap would maintain these as separate records linked to the same event.

The proposed system would support coordination and recordkeeping through a shared approval and attendance process aligned with school procedures.

A.2. Users, Stakeholders, and Responsibilities

User or stakeholder

Main responsibilities or interests

Student organization officer

Prepare proposals for the assigned organization, respond to revisions, monitor decisions, record attendance, and obtain reports for the organization's events.

Faculty adviser

Review proposals from assigned organizations and endorse, return, or reject them with appropriate remarks.

Student Affairs personnel

Make final approval decisions, resolve scheduling concerns, cancel approved events when necessary, and review institutional event records.

Student attendee

View approved events and register for or withdraw from an event within the permitted period.

School management

Review event activity and participation information through authorized Student Affairs reports.

Authorized IT personnel

Advise on technical feasibility and support a possible future implementation.

The proposed administrative arrangement assigns account access and organization assignments to designated Student Affairs personnel.

A.3. Implemented Baseline Workflow

An organization officer or active organization member prepares a draft proposal containing the title, activity type, academic semester, rationale, activities, venue, schedule, participant capacity, registration deadline, and required institutional attachments. After validation, submission places the proposal in Pending Adviser Review and triggers a database notification for the assigned adviser.

The assigned faculty adviser can endorse the proposal, return it for revision, or reject it with remarks. Endorsement notifies Student Affairs personnel and routes the proposal to Pending Student Affairs Review. Student Affairs can approve it, return it for revision, or reject it. Final approval locks the venue row in PostgreSQL, checks for venue overlap, transitions the status to Approved, and notifies the submitting officer.

Returned proposals remain editable by any authorized organization member or officer. Resubmission restarts adviser review so both approving parties evaluate the revised submission while preserving chronological review history. Approved proposals cannot be edited directly.

Approved events appear alongside visible in-workflow proposals inside the unified Events explorer and Calendar grid. Active students can register before the deadline while capacity remains, immediately receiving an event-specific 32-character QR token and 16-character passcode pass in the My Event Passes view, or withdraw before the deadline via confirmation dialog. During the check-in window starting 30 minutes before the scheduled start until event end, authorized officers of the organizing group or Student Affairs staff record verified attendance via manual roster lookup or QR scanner and export RFC 4180 CSV audit reports directly from the unified Attendance Desk.

The implemented proposal and event statuses are Draft, Pending Adviser Review, Pending Student Affairs Review, Returned by Adviser, Returned by Student Affairs, Approved, Rejected by Adviser, Rejected by Student Affairs, and Cancelled. Public Privacy Policy (`/privacy`) and Terms of Service (`/terms`) pages document data governance and acceptable use.

A.4. Scope and Boundaries

Included in the proposed design

Outside the proposed scope

One school or university and its recognized student organizations

Multiple institutions or public event marketplaces

Officer submission, adviser endorsement, and Student Affairs approval

Unlimited or independently configurable approval stages

One venue and one continuous schedule per event

Multi-venue or recurring-event scheduling

Approved event viewing and student registration

Paid tickets, payments, refunds, or external guests

Officer-assisted digital attendance

Biometrics, facial recognition, or location tracking

Event attendance reports

Academic grades, participation credit, or financial accounting

Optional calendar, notifications, QR attendance, and summary counts

Social-media integration or a full learning management system

Digital attendance would be available through a registered-student list. QR scanning would be an optional enhancement using the same attendance rules.

A.5. Assumptions, Constraints, and Dependencies

The requirements use the following assumptions:

Each account has an assigned role and, where relevant, an organization or adviser assignment.

Students attending events have active school accounts.

Events are open to registered students of the institution; organization-exclusive eligibility rules are outside this initial scope.

Each event has one venue, a participant capacity, and a registration deadline no later than its start time.

All schedules use the institution's designated local time.

Venue conflict checking covers events recorded in OrGanap. Other school bookings would be supplied or checked separately.

Approved events cannot be edited directly. Student Affairs may cancel an approved event before its scheduled start, after which a replacement proposal may be submitted.

The two-member team will prioritize a coherent approval-to-attendance workflow. School policies, account information, venue records, and access to representative stakeholders are dependencies for finalizing the design.

A.6. Inputs, Processes, and Outputs

Inputs

Main processes

Outputs

Account credentials, roles, and organization assignments

Authenticate users and enforce access permissions

Authorized user access and role-appropriate actions

Event title, purpose, activities, venue, schedule, capacity, and registration deadline

Save drafts, validate fields, and submit proposals

Saved proposal and submission status

Reviewer decisions and remarks

Route proposals and record review outcomes

Decision history and current approval status

Requested venue and schedule

Compare against approved event reservations

Availability result or conflict message

Student registration requests

Check event status, deadline, capacity, and duplicate registration

Registration confirmation or rejection reason

Verified registered student and event

Record attendance and prevent duplicate check-ins

Attendance entry and timestamp

Authorized report request

Retrieve event registration and attendance information

Event attendance report and CSV export

A.7. Proposed Validation and Ethical Handling

The team proposes to consult at least one organization officer, one faculty adviser, and one Student Affairs representative, subject to availability. Questions would examine the current approval sequence, required proposal fields, common sources of delay, venue reservation practices, attendance procedures, and reporting needs.

Available forms and policies would be reviewed to verify the proposed rules. Stakeholders would also be asked to walk through one sample event, from proposal preparation to attendance reporting.

Participation would be voluntary. The team would explain the purpose of the activity, obtain permission before recording responses, and remove identifying information from examples. Synthetic student records would be used in design demonstrations.

3. Part B: Requirements Specification

The following requirements define the proposed behavior and quality expectations of OrGanap. FR identifies a functional requirement, NFR identifies a non-functional requirement, and US identifies a user story.

B.1. Functional Requirements

ID

Requirement Statement

Description

Priority

FR-01

The system shall authenticate active users using their registered school account credentials.

Invalid credentials and inactive accounts must be denied access.

Must Have

FR-02

The system shall allow designated Student Affairs personnel to activate or deactivate accounts, manage dynamic role groups and granular permissions, and assign organization associations.

Implemented via dynamic Django-style RBAC (`groups`, `permissions`, `group_permissions`, `user_groups`, `user_permissions`, `is_staff`, `is_superuser`) alongside organization rosters. Other users cannot alter permissions or institutional assignments.

Must Have

FR-03

The system shall allow an authorized organization member or officer to create and save a draft event proposal for the assigned organization.

Draft fields include title, activity type, academic semester, rationale, activities, venue, start and end times, capacity, registration deadline, and file attachments (`event_attachments`).

Must Have

FR-04

The system shall validate a proposal before accepting its submission and routing it to the assigned adviser.

Required fields must be complete, required institutional `attachment_types` must be uploaded, capacity must be positive, start must precede end, and registration deadline must not exceed start time. Submission sets status to Pending Adviser Review.

Must Have

FR-05

The system shall allow the assigned adviser to endorse, return, or reject a proposal awaiting adviser review.

Endorsement routes the proposal to Student Affairs. Return and rejection require remarks.

Must Have

FR-06

The system shall allow authorized Student Affairs personnel to approve, return, or reject an endorsed proposal awaiting final review.

Approval requires a successful venue conflict check. Return and rejection require remarks.

Must Have

FR-07

The system shall prevent final approval when another approved event reserves the same venue during an overlapping period.

Two periods overlap when each begins before the other ends. An event ending exactly when another starts does not overlap. Cancelled events do not reserve venues.

Must Have

FR-08

The system shall allow the submitting organization to revise and resubmit a proposal marked Returned for Revision.

Resubmission restarts adviser review and retains the previous submission and decision history.

Must Have

FR-09

The system shall display a proposal's current status and chronological review history to its submitting organization and authorized reviewers.

The history includes each decision, reviewer, timestamp, and remarks, accessible from the unified Events route (`/events/[id]?view=review`).

Must Have

FR-10

The system shall allow active student users to view the details of approved events while excluding unapproved drafts from student listings.

Details include organizing group, activity type, semester, rationale, venue, schedule, capacity, registration deadline, and attachments. Officers, advisers, and Student Affairs see their visible proposals merged in the unified Events explorer.

Must Have

FR-11

The system shall create in-application notifications for users affected by proposal submissions, endorsements, returns, rejections, approvals, student registrations, and event cancellations.

A database trigger and stored procedures dispatch alerts automatically, surfaced on `/notifications` and unread count badges in Sidebar and Navbar.

Should Have

FR-12

The system shall allow an active student to register for or withdraw from an approved event before its registration deadline.

Registration requires available capacity and no active (`confirmed` or `attended`) registration. Withdrawal via confirmation dialog releases the seat and invalidates the old pass token. Checked-in registrations cannot be withdrawn.

Must Have

FR-13

The system shall allow an authorized officer of the organizing group or Student Affairs staff to record a registered student's attendance during the check-in window.

The check-in window opens 30 minutes before `start_time` and closes at `end_time`. The event must remain approved, cross-organization officers are blocked, and each student has at most one attendance record.

Must Have

FR-14

The system shall generate and export an event attendance report directly within the unified Attendance Desk for authorized organization officers and Student Affairs personnel.

The `/attendance/[id]` console displays registered vs attended counts, turnout rate, capacity utilization, check-in timestamps, and RFC 4180 UTF-8 BOM CSV export (`/reports/*` redirects to `/attendance/*`).

Must Have

FR-15

The system shall allow Student Affairs personnel to cancel an approved event before its scheduled start by providing a reason.

Cancellation blocks registration and check-in, releases the venue reservation, preserves existing records and cancellation reason, and notifies registrants.

Must Have

FR-16

The system shall display approved events and visible schedule entries in a calendar organized by date.

Integrated as a view tab inside `/events` where users open event details directly from calendar entries.

Should Have

FR-17

The system shall provide an event-specific QR pass and formatted passcode for each registration and allow authorized officers to verify attendance via scanner or manual entry.

Generates a 32-character hex token (`extensions.gen_random_bytes`) and 16-character hyphenated passcode (`XXXX-XXXX-XXXX-XXXX`), rejecting duplicate check-ins, withdrawn tokens, and passes from other events.

Could Have

FR-18

The system shall display live role-scoped summary counts, action queues, and upcoming events on the Overview dashboard.

`/dashboard` displays role-adapted KPIs, organization-scoped or institutional registration and attendance totals, review queues, student passes, and upcoming approved events.

Could Have

B.2. Non-Functional Requirements

ID

Quality Category

Requirement Statement

Verification Method

Priority

NFR-01

Performance

The system shall return at least 95% of event-list, proposal-status, and registration requests within 3 seconds when tested with 100 concurrent active users on the agreed test environment.

Conduct a load test using representative records and report the 95th-percentile response time and environment.

Must Have

NFR-02

Security and access control

The system shall enforce role and organization permissions on every protected screen, data request, and export.

Test permitted and prohibited actions for each role, including attempts to access another organization's records through direct requests.

Must Have

NFR-03

Security

The system shall protect authenticated communication using HTTPS and store locally managed passwords only as salted, one-way hashes.

Inspect transport configuration, credential storage, and logs to confirm that readable passwords are not stored or exposed.

Must Have

NFR-04

Usability

The system shall enable at least 4 of 5 representative student participants to find an approved event and complete registration within 3 minutes without facilitator assistance.

Conduct a task-based usability evaluation and record completion, elapsed time, and assistance required.

Must Have

NFR-05

Accessibility

The system shall make core approval, registration, and attendance controls operable by keyboard, with visible focus, descriptive labels, and text explanations for errors.

Inspect and perform the core tasks using keyboard navigation; verify that meaning is not communicated through color alone.

Must Have

NFR-06

Reliability and recovery

The system shall support backups at intervals no greater than 24 hours and restoration from the latest successful backup within 4 hours.

Restore a backup in a test environment and measure backup age, restoration time, and record completeness.

Should Have

NFR-07

Data privacy

The system shall restrict student profile fields to school ID, name, school email, role, and relevant organization association, with attendance identities accessible only to authorized users.

Review data fields, screens, permissions, and exports. Confirm that student users cannot retrieve other students' registration or attendance records.

Must Have

NFR-08

Data integrity

The system shall preserve venue, registration, and attendance rules during simultaneous or repeated requests.

Test competing venue approvals, registrations for the last available place, and repeated check-in requests; confirm that conflicts, overbooking, and duplicate attendance do not occur.

Must Have

Basis for the Numerical Targets

The 100-user load is a proposed test scenario for an initial single-institution deployment. The 3-second response target supports short, repeated interactions during proposal tracking and registration. Expected event participation and peak demand would provide the basis for adjusting the capacity target.

The usability target provides an observable benchmark for a brief student task. Five participants would support a small formative evaluation, while the 3-minute limit tests whether students can complete registration without substantial guidance.

The backup and restoration targets represent an initial operating proposal. Daily backups can expose up to 24 hours of recent changes to loss after a major failure. The proposed 4-hour restoration target provides a recovery benchmark, with acceptable data loss and downtime subject to institutional requirements.

B.3. User Stories and Acceptance Criteria

US-01: Prepare and Submit an Event Proposal

User story: As a student organization officer, I want to prepare and submit an event proposal, so that our organization can request permission to conduct an activity.

Related requirements: FR-03, FR-04, FR-08, FR-09, NFR-02.

Acceptance criteria:

1. An officer can save an incomplete proposal as a draft for the officer's assigned organization.

2. A complete proposal with valid dates, capacity, and deadline can be submitted and assigned Pending Adviser Review.

3. Missing required fields or invalid values produce field-specific messages and prevent submission.

4. A returned proposal can be revised and resubmitted to the adviser while retaining its earlier decisions.

5. An officer cannot edit proposals belonging to another organization or directly modify an approved proposal.

US-02: Review a Proposal as an Adviser

User story: As a faculty adviser, I want to review proposals from my assigned organizations, so that I can assess their suitability before final approval.

Related requirements: FR-05, FR-09, NFR-02.

Acceptance criteria:

1. The adviser can view proposals awaiting adviser review from assigned organizations.

2. Endorsing a proposal changes its status to Pending Student Affairs Review.

3. Returning or rejecting a proposal requires non-empty remarks.

4. The selected decision, reviewer, timestamp, and remarks appear in the review history.

5. The adviser cannot decide on a proposal from an unassigned organization.

US-03: Make a Final Approval Decision

User story: As a Student Affairs representative, I want to review endorsed proposals and check venue availability, so that approved events follow the school's approval process and do not conflict with existing reservations.

Related requirements: FR-06, FR-07, FR-09, FR-10, NFR-08.

Acceptance criteria:

1. Final approval is available only for proposals awaiting Student Affairs review after adviser endorsement.

2. A proposal with no venue conflict can be approved and appears in the student event listing.

3. An overlapping reservation for the same venue prevents approval and identifies the conflict.

4. If two conflicting proposals are approved simultaneously, only one obtains the reservation.

5. Returning or rejecting a proposal requires remarks and updates its review history.

US-04: Register for an Approved Event

User story: As a student attendee, I want to register for an approved event, so that I can reserve a place in an activity I want to attend.

Related requirements: FR-10, FR-12, FR-15, NFR-04, NFR-08.

Acceptance criteria:

1. A student can view an approved event's details and registration availability.

2. Registration succeeds when the deadline has not passed, capacity remains, and the student has no active registration for that event.

3. Successful registration provides confirmation and reduces the available places by one.

4. A full event, expired deadline, cancelled event, or duplicate request prevents registration and displays the reason.

5. A student can withdraw before the deadline, releasing the reserved place.

US-05: Record Event Attendance

User story: As an organizing officer, I want to record the attendance of verified registered students, so that our organization has an accurate record of actual participation.

Related requirements: FR-13, NFR-02, NFR-07, NFR-08.

Acceptance criteria:

1. An authorized officer can open the registered-student list for the officer's organization's approved event.

2. During the scheduled period, the officer can confirm a registered student's presence after checking the student's identity.

3. Successful check-in creates one attendance record with the student, event, and timestamp.

4. A repeated check-in displays that attendance is already recorded without adding another record.

5. Check-in is denied for an unregistered student, a cancelled event, an event outside its scheduled period, or an unauthorized officer.

US-06: Obtain an Attendance Report

User story: As a Student Affairs representative, I want to obtain event attendance reports, so that I can review participation using consistent event records.

Related requirements: FR-14, NFR-02, NFR-07.

Acceptance criteria:

1. The representative can select an event and view its registrations, recorded attendees, timestamps, and totals.

2. The report distinguishes registered students from students with recorded attendance.

3. CSV export contains the same event and attendance information shown in the report.

4. The displayed and exported totals agree with the underlying records.

5. Organization officers can obtain equivalent reports only for their own organization's events.

B.4. Requirements Prioritization

OrGanap uses the Must Have, Should Have, and Could Have categories of MoSCoW prioritization. Priority reflects the importance of a requirement to the proposed system's purpose, its dependencies, associated risks, and feasibility for a two-member project.

A Must Have requirement is essential to the approval, registration, attendance, or reporting workflow, or to the protection and correctness of its records.

A Should Have requirement provides substantial value but has a workable alternative in the initial design. For example, users can inspect proposal status without notifications and browse an event list without a calendar.

A Could Have requirement is an enhancement that may be designed if time permits after the essential workflow is complete.

Priority

Requirements

Justification

Must Have

FR-01 to FR-10; FR-12 to FR-15; NFR-01 to NFR-05; NFR-07 to NFR-08

Establishes controlled access, valid proposal submission, accountable decisions, conflict prevention, student registration, attendance, reporting, privacy, accessibility, and record integrity.

Should Have

FR-11, FR-16, NFR-06

Notifications and calendar views improve coordination and convenience. Backup and recovery planning supports future operation, with numerical targets based on institutional requirements.

Could Have

FR-17, FR-18

QR-assisted attendance and summary counts improve convenience but are not necessary to demonstrate the complete core workflow.