# UI Rules

## Language

- UI copy should be Vietnamese.
- Keep labels practical for landlords and brokers.
- Do not expose internal/virtual email.

## Overall Style

- Mobile-first.
- Tailwind CSS.
- Existing dashboard shell uses white cards, slate backgrounds, teal primary actions.
- Do not introduce a major theme redesign without explicit request.
- Avoid large marketing/landing-page style UI inside operational dashboard.

## Dashboard

- Landlord dashboard prioritizes:
  - total buildings
  - total rooms
  - available rooms
  - coming soon rooms
  - building list
  - add building
  - sell list

## Landlord Forms

- Forms should be sectioned clearly:
  - main room info
  - fees
  - features
  - images
  - description
- Inputs should be large enough for mobile.
- Validation must be server-side.
- Fee fields should show:
  - electricity unit `kWh`
  - water unit `m3`
  - bicycle parking
  - motorbike parking
  - car parking
- `min_lease_months` should show suffix "tháng".

## Building Detail

- Building detail should show:
  - header actions
  - building summary
  - building common fees form
  - compact room list
- Room list must support quick edit of:
  - status
  - rent price
  - deposit amount
  - available date
- Room list should be sorted by floor and natural room code.

## Room Detail

- Show:
  - room status
  - rent/deposit/area/available date/min lease term
  - effective fees
  - images/Drive links
  - features
  - edit and duplicate actions

## Sell List

- Sell list groups rooms by building.
- Show room code, price, deposit, area, status, available date, min lease if available.
- `Copy` button can copy a simple text template.
- `Gửi Zalo sau` is disabled placeholder only.

## Buttons and Actions

- Primary actions use teal.
- Secondary actions use borders/white backgrounds.
- Destructive actions are not part of current Module 04 UI.
- Icon buttons should have `aria-label`.
- Keep touch targets around 40-48px height where possible.

## Do Not

- Do not build broker dashboard in Module 04.
- Do not integrate Zalo API.
- Do not add Google Drive Picker.
- Do not redesign admin/broker pages while working on landlord flow.
