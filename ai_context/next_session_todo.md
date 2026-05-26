# Next Session TODO

Use this file to continue Module 04 in a fresh Codex chat.

## Read First

1. `skill.md`
2. `ai_context/system_architecture.md`
3. `ai_context/business_rules.md`
4. `ai_context/db_rules.md`
5. `ai_context/ui_rules.md`
6. `ai_context/current_status.md`
7. `ai_context/known_issues.md`
8. `supabase/module_04_landlord_flow_revision.sql`
9. `app/landlord/actions.ts`
10. `lib/landlord/queries.ts`
11. `components/landlord/room-form.tsx`
12. `components/landlord/room-quick-list.tsx`

Also read external files if available:

- `C:\Users\PC\Downloads\PROJECT_CONTEXT.md`
- `C:\Users\PC\Downloads\PRD_MVP_V1.md`
- `C:\Users\PC\Downloads\module_02_supabase_schema.sql`

## Immediate Next Steps

1. Confirm whether `supabase/module_04_landlord_flow_revision.sql` was successfully run in Supabase.
2. If migration failed, ensure Supabase SQL Editor uses the current local migration with:
   - `drop view if exists public.v_broker_rooms;`
   - `create view public.v_broker_rooms as`
3. If migration succeeds, manually test landlord flow with an active landlord account.
4. Test building fees create/update.
5. Test room create with `building_default`.
6. Test room create/edit with `room_override`.
7. Test quick edit from building detail.
8. Test duplicate room flow.
9. Test image link and upload flow.
10. Test sell lists.

## Do Not Redo

- Do not rebuild Module 03 auth.
- Do not recreate Module 04 from scratch.
- Do not replace server actions with client-side Supabase writes.
- Do not implement broker dashboard.
- Do not add Zalo API.
- Do not add Google Drive Picker.
- Do not remove legacy `room_fees.parking_fee` without explicit user approval.

## If Tests Fail

- If landlord pages fail with missing column/table errors, migration has not applied.
- If view migration fails, verify old SQL is not still pasted in Supabase.
- If upload fails, inspect Storage bucket `room-images` and policies.
- If quick edit status does not create log, inspect trigger `trg_rooms_status_log`.
- If broker visibility fails, inspect `can_broker_view_landlord` and RLS policies.
- If TypeScript fails, run `.\node_modules\.bin\tsc.cmd --noEmit` and fix narrowly.

## Suggested Prompt for New Chat

```text
Tôi đang tiếp tục project Kho Phòng Realtime.

Hãy đọc trước:
- skill.md
- toàn bộ ai_context/
- supabase/module_04_landlord_flow_revision.sql
- app/landlord/actions.ts
- lib/landlord/queries.ts
- components/landlord/room-form.tsx
- components/landlord/room-quick-list.tsx

Tình trạng hiện tại:
- Module 03 Auth đã ổn, không sửa kiến trúc auth.
- Module 04 Landlord Flow đã code xong bản revision nhưng cần kiểm tra migration Supabase và test thủ công.
- Migration Module 04 từng lỗi do create or replace view v_broker_rooms; file local đã sửa thành drop view + create view.

Nhiệm vụ:
1. Xác nhận migration Module 04 đã chạy được chưa.
2. Nếu chưa, hướng dẫn/sửa migration tối thiểu.
3. Sau đó test landlord flow: phí chung, phí riêng, tạo phòng, duplicate phòng, upload ảnh, quick edit, sell list.
4. Không làm broker dashboard, không Zalo API, không Google Drive Picker.
```
