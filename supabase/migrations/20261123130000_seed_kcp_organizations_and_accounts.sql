-- =============================================================================
-- Migration: 20261123130000_seed_kcp_organizations_and_accounts.sql
-- Replaces placeholder sample organizations with the 10 KCP Student Organizations
-- from https://soams-three.vercel.app/, and creates Auth accounts, profiles,
-- group assignments, and memberships for all 97 organization members plus the
-- 3 OSAS Personnel & Directors (default password: Password123!).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Remove Previous Sample Organizations
-- -----------------------------------------------------------------------------

delete from public.organizations;

-- -----------------------------------------------------------------------------
-- 2. Upsert 100 User Accounts (3 OSAS Personnel/Director + 97 Org Members)
-- -----------------------------------------------------------------------------

do $$
declare
  v_password_hash text;
  v_group_sa uuid;
  v_group_officers uuid;
  v_group_students uuid;
  v_rec record;
begin
  v_password_hash := extensions.crypt('Password123!', extensions.gen_salt('bf'));

  select id into v_group_sa from public.groups where name = 'Student Affairs' limit 1;
  select id into v_group_officers from public.groups where name = 'Student Organization Officers' limit 1;
  select id into v_group_students from public.groups where name = 'Students' limit 1;

  for v_rec in
    select *
    from (
      values
      ('89193c0b-c8d8-42f0-8b60-a6fb533e23bd'::uuid, 'staff01@organap.edu', 'Morgan Reyes', 'ORG-OSA-001', null, true, 'osa_director', 'OSAS Director', null),
      ('4c3ec436-78ec-4c2a-b493-b6285737a4b9'::uuid, 'staff02@organap.edu', 'Taylor Navarro', 'ORG-OSA-002', null, true, 'osa_personnel', 'Student Development Coordinator', null),
      ('c6d27073-3d87-4fe7-9b2c-f8f633bc626a'::uuid, 'staff03@organap.edu', 'Jordan Velasco', 'ORG-OSA-003', null, true, 'osa_personnel', 'Student Welfare Coordinator', null),
      ('9e705766-aad8-48f1-8c22-372391b8a1cd'::uuid, 'avery.alvarez@organap.edu', 'Avery Alvarez', '2027-0001', null, false, 'org_head', 'Chieftain', 'gabay'),
      ('362fa123-ae64-4dfa-87d8-07d471f32223'::uuid, 'avery.bautista@organap.edu', 'Avery Bautista', '2027-0002', null, false, 'org_head', 'Editor-in-Chief', 'loquitor'),
      ('cd91be64-061c-48e6-b775-daeac506e775'::uuid, 'avery.castillo@organap.edu', 'Avery Castillo', '2027-0003', null, false, 'org_head', 'Governor', 'ccje-sbo'),
      ('7514a1e4-db97-4bea-a633-3b5a770332a3'::uuid, 'avery.delgado@organap.edu', 'Avery Delgado', '2027-0004', null, false, 'org_head', 'Governor', 'cabm-sbo'),
      ('25c8f38f-5d8b-4441-a16d-9761312899ba'::uuid, 'avery.estrada@organap.edu', 'Avery Estrada', '2027-0005', null, false, 'org_head', 'Governor', 'ctela-sbo'),
      ('8cd9411b-e9b3-4e28-aa92-11ed149c7563'::uuid, 'avery.ferrer@organap.edu', 'Avery Ferrer', '2027-0006', null, false, 'org_head', 'Governor', 'theology-sbo'),
      ('0a6408d9-bf2c-42ee-a1aa-4ff892218929'::uuid, 'avery.gomez@organap.edu', 'Avery Gomez', '2027-0007', null, false, 'org_head', 'Governor', 'cit-sbo'),
      ('a429c0f5-3de9-4ad4-b6e2-76f8f26780b9'::uuid, 'avery.hernandez@organap.edu', 'Avery Hernandez', '2027-0008', null, false, 'org_head', 'President', 'ruling-conquerors'),
      ('c2ff7929-5350-4178-a5aa-9bd5a405617e'::uuid, 'avery.ibarra@organap.edu', 'Avery Ibarra', '2027-0009', null, false, 'org_head', 'President', 'psych-club'),
      ('dfbf9e77-bfb1-4ee2-ada6-41fa743900c9'::uuid, 'avery.jimenez@organap.edu', 'Avery Jimenez', '2027-0010', null, false, 'org_head', 'Prime Minister', 'ssc'),
      ('241af3b6-fa34-433a-b224-0ca63d3cc2e6'::uuid, 'avery.ledesma@organap.edu', 'Avery Ledesma', '2027-0011', null, false, 'org_officer', 'Associate Editor', 'loquitor'),
      ('a2680327-9cf8-4b59-b1a7-b86e02ac82f5'::uuid, 'avery.marquez@organap.edu', 'Avery Marquez', '2027-0012', null, false, 'org_officer', 'Deputy Prime Minister', 'ssc'),
      ('58c122c4-fba0-493b-a423-3e457101bd97'::uuid, 'avery.nolasco@organap.edu', 'Avery Nolasco', '2027-0013', null, false, 'org_officer', 'Vice Chieftain', 'gabay'),
      ('711ccc3e-3483-4464-8f99-f25f5925b6c0'::uuid, 'avery.ocampo@organap.edu', 'Avery Ocampo', '2027-0014', null, false, 'org_officer', 'Vice Governor', 'ccje-sbo'),
      ('3587abf9-369f-4e23-9161-c3dea49dadf9'::uuid, 'avery.peralta@organap.edu', 'Avery Peralta', '2027-0015', null, false, 'org_officer', 'Vice Governor', 'ctela-sbo'),
      ('1d2e7668-e065-4dde-98b7-5034d9bf3516'::uuid, 'avery.salazar@organap.edu', 'Avery Salazar', '2027-0016', null, false, 'org_officer', 'Vice Governor', 'cit-sbo'),
      ('cc679ef8-79b1-4e88-ac74-b3f7f2240263'::uuid, 'blake.alvarez@organap.edu', 'Blake Alvarez', '2027-0017', null, false, 'org_officer', 'Vice Governor', 'theology-sbo'),
      ('fb03dc88-51bf-464f-8aac-b15c7ff6731a'::uuid, 'blake.bautista@organap.edu', 'Blake Bautista', '2027-0018', null, false, 'org_officer', 'Vice Governor', 'cabm-sbo'),
      ('072bc94b-f5b4-443e-b52a-28d7fba8844b'::uuid, 'blake.castillo@organap.edu', 'Blake Castillo', '2027-0019', null, false, 'org_officer', 'Vice President', 'psych-club'),
      ('df0636cd-d07e-4c8f-97c7-81c82aebb144'::uuid, 'blake.delgado@organap.edu', 'Blake Delgado', '2027-0020', null, false, 'org_officer', 'Vice President for Internal Affairs', 'ruling-conquerors'),
      ('9d1e9908-f42e-446a-8564-f60eb6181c53'::uuid, 'blake.estrada@organap.edu', 'Blake Estrada', '2027-0021', null, false, 'org_officer', 'Finance Manager', 'loquitor'),
      ('65eb1ef9-a87e-4ae8-afc8-63594d0f94da'::uuid, 'blake.ferrer@organap.edu', 'Blake Ferrer', '2027-0022', null, false, 'org_officer', 'Secretary', 'ccje-sbo'),
      ('31967f70-20c3-477c-913c-8cdd9c6bd093'::uuid, 'blake.gomez@organap.edu', 'Blake Gomez', '2027-0023', null, false, 'org_officer', 'Secretary', 'gabay'),
      ('f63ff257-227a-4b62-813c-c87bee7ab955'::uuid, 'blake.hernandez@organap.edu', 'Blake Hernandez', '2027-0024', null, false, 'org_officer', 'Secretary', 'ssc'),
      ('6f645613-2a4e-445d-96a7-a40693e277b2'::uuid, 'blake.ibarra@organap.edu', 'Blake Ibarra', '2027-0025', null, false, 'org_officer', 'Secretary', 'ctela-sbo'),
      ('e52c4d52-278f-4ec6-b369-9337e31ef696'::uuid, 'blake.jimenez@organap.edu', 'Blake Jimenez', '2027-0026', null, false, 'org_officer', 'Secretary', 'cit-sbo'),
      ('47657994-fd3f-408e-a7d9-0d6c2ed7caac'::uuid, 'blake.ledesma@organap.edu', 'Blake Ledesma', '2027-0027', null, false, 'org_officer', 'Secretary', 'psych-club'),
      ('30c8f2b4-7d15-4698-8b72-36097a19f043'::uuid, 'blake.marquez@organap.edu', 'Blake Marquez', '2027-0028', null, false, 'org_officer', 'Secretary', 'cabm-sbo'),
      ('3f58838b-232c-4229-80a7-9908c5c63698'::uuid, 'blake.nolasco@organap.edu', 'Blake Nolasco', '2027-0029', null, false, 'org_officer', 'Secretary', 'theology-sbo'),
      ('19e0654d-5223-42ef-b8d9-27ef6c07775f'::uuid, 'blake.ocampo@organap.edu', 'Blake Ocampo', '2027-0030', null, false, 'org_officer', 'Vice President for External Affairs', 'ruling-conquerors'),
      ('64aab1ec-e211-41bf-9707-a64e7978e333'::uuid, 'blake.peralta@organap.edu', 'Blake Peralta', '2027-0031', null, false, 'org_officer', 'Assistant Secretary', 'gabay'),
      ('25c711c7-a3bc-4d8c-bac0-181311056fd2'::uuid, 'blake.salazar@organap.edu', 'Blake Salazar', '2027-0032', null, false, 'org_officer', 'Assistant Secretary', 'ssc'),
      ('c49d28fc-62e7-4199-b166-813e2bf8bfe4'::uuid, 'casey.alvarez@organap.edu', 'Casey Alvarez', '2027-0033', null, false, 'org_officer', 'Assistant Secretary', 'psych-club'),
      ('c9836097-df7e-4e69-9c43-579e1b43d90f'::uuid, 'casey.bautista@organap.edu', 'Casey Bautista', '2027-0034', null, false, 'org_officer', 'Assistant Secretary', 'cit-sbo'),
      ('3260ba45-489c-417a-9e6f-cdb8d9aeef6b'::uuid, 'casey.castillo@organap.edu', 'Casey Castillo', '2027-0035', null, false, 'org_officer', 'Managing Editor', 'loquitor'),
      ('94b5c3ef-9cf6-4d2e-a1e8-d8f3b0103a98'::uuid, 'casey.delgado@organap.edu', 'Casey Delgado', '2027-0036', null, false, 'org_officer', 'Secretary', 'ruling-conquerors'),
      ('e37b844c-9717-4901-a382-abd92161b8f3'::uuid, 'casey.estrada@organap.edu', 'Casey Estrada', '2027-0037', null, false, 'org_officer', 'Treasurer', 'ccje-sbo'),
      ('c1ad8ef5-a00f-4027-8cd2-d489a9355223'::uuid, 'casey.ferrer@organap.edu', 'Casey Ferrer', '2027-0038', null, false, 'org_officer', 'Treasurer', 'theology-sbo'),
      ('66ea0853-75fc-4398-8037-99eb0cc09f6b'::uuid, 'casey.gomez@organap.edu', 'Casey Gomez', '2027-0039', null, false, 'org_officer', 'Treasurer', 'cabm-sbo'),
      ('c590328b-bd40-4887-ab33-c25ead97d8fb'::uuid, 'casey.hernandez@organap.edu', 'Casey Hernandez', '2027-0040', null, false, 'org_officer', 'Treasurer', 'ctela-sbo'),
      ('3b78f198-2a01-419b-bb17-d866da3891cd'::uuid, 'casey.ibarra@organap.edu', 'Casey Ibarra', '2027-0041', null, false, 'org_officer', 'Assistant Secretary', 'ruling-conquerors'),
      ('36eb2193-8a40-4e3f-8e05-595a7f3c6a3c'::uuid, 'casey.jimenez@organap.edu', 'Casey Jimenez', '2027-0042', null, false, 'org_officer', 'Auditor', 'theology-sbo'),
      ('281a3239-f15f-430f-be31-b24eadb6f60e'::uuid, 'casey.ledesma@organap.edu', 'Casey Ledesma', '2027-0043', null, false, 'org_officer', 'Auditor', 'cabm-sbo'),
      ('75f3f81d-7fb3-4d5e-95a9-4b492295cdb0'::uuid, 'casey.marquez@organap.edu', 'Casey Marquez', '2027-0044', null, false, 'org_officer', 'Auditor', 'ccje-sbo'),
      ('d7b0dd7d-5796-4b54-884b-ffeda01c8b01'::uuid, 'casey.nolasco@organap.edu', 'Casey Nolasco', '2027-0045', null, false, 'org_officer', 'Auditor', 'ctela-sbo'),
      ('e6cedf00-b8b9-4384-a0a8-88eda6d248f5'::uuid, 'casey.ocampo@organap.edu', 'Casey Ocampo', '2027-0046', null, false, 'org_member', 'Head Cartoonist', 'loquitor'),
      ('6c62f7b5-4eb2-48ac-a8fb-878f9bdfbdd2'::uuid, 'casey.peralta@organap.edu', 'Casey Peralta', '2027-0047', null, false, 'org_officer', 'Minister of Finance', 'ssc'),
      ('40ead038-42ab-45e6-bce1-6a58c0cb44b5'::uuid, 'casey.salazar@organap.edu', 'Casey Salazar', '2027-0048', null, false, 'org_officer', 'Treasurer', 'psych-club'),
      ('3ddc92c1-2255-4b91-b05a-d88cce87b25a'::uuid, 'devon.alvarez@organap.edu', 'Devon Alvarez', '2027-0049', null, false, 'org_officer', 'Treasurer', 'cit-sbo'),
      ('f1bc001b-0b2d-4a44-bc2f-f213c7c0a397'::uuid, 'devon.bautista@organap.edu', 'Devon Bautista', '2027-0050', null, false, 'org_officer', 'Treasurer', 'gabay'),
      ('898c5fbc-0ab8-42c6-b111-0ad3a83b081e'::uuid, 'devon.castillo@organap.edu', 'Devon Castillo', '2027-0051', null, false, 'org_member', '4th Year Representative', 'cabm-sbo'),
      ('7836762e-60c6-4592-8b3e-3601762fa2a2'::uuid, 'devon.delgado@organap.edu', 'Devon Delgado', '2027-0052', null, false, 'org_member', '4th Year Representative', 'ctela-sbo'),
      ('7aedd945-bb15-41df-a218-a13c070943e8'::uuid, 'devon.estrada@organap.edu', 'Devon Estrada', '2027-0053', null, false, 'org_member', '4th Year Representative', 'ccje-sbo'),
      ('57c186a7-a1ce-4ecb-bfc7-94b7f6e29ecc'::uuid, 'devon.ferrer@organap.edu', 'Devon Ferrer', '2027-0054', null, false, 'org_officer', 'Auditor', 'gabay'),
      ('dc5a196c-e3e0-49dd-a0d0-3009332da2b6'::uuid, 'devon.gomez@organap.edu', 'Devon Gomez', '2027-0055', null, false, 'org_officer', 'Auditor', 'cit-sbo'),
      ('e010106a-cf5d-4b62-ba46-084ed92dec2f'::uuid, 'devon.hernandez@organap.edu', 'Devon Hernandez', '2027-0056', null, false, 'org_officer', 'Auditor', 'psych-club'),
      ('d1abc306-266e-4bee-bd9c-99eeab37a864'::uuid, 'devon.ibarra@organap.edu', 'Devon Ibarra', '2027-0057', null, false, 'org_member', 'Graphics and Layout Editor', 'loquitor'),
      ('ff3d541e-ba72-4013-a33e-62d8513d38d2'::uuid, 'devon.jimenez@organap.edu', 'Devon Jimenez', '2027-0058', null, false, 'org_officer', 'Minister of Internal Affairs', 'ssc'),
      ('5c58dcea-9fb9-4af5-9775-542b7646155f'::uuid, 'devon.ledesma@organap.edu', 'Devon Ledesma', '2027-0059', null, false, 'org_officer', 'Treasurer', 'ruling-conquerors'),
      ('e611d66d-8653-41ee-b3f7-0f7a94883232'::uuid, 'devon.marquez@organap.edu', 'Devon Marquez', '2027-0060', null, false, 'org_member', '3rd Year Representative', 'ccje-sbo'),
      ('bd4a3601-9db8-48c2-bf43-445bc2efd9f7'::uuid, 'devon.nolasco@organap.edu', 'Devon Nolasco', '2027-0061', null, false, 'org_member', '3rd Year Representative', 'ctela-sbo'),
      ('a4da4eb5-e6fc-43c5-a5db-e93d0f3c8476'::uuid, 'devon.ocampo@organap.edu', 'Devon Ocampo', '2027-0062', null, false, 'org_member', '3rd Year Representative', 'cabm-sbo'),
      ('44ffe800-ac3b-42c7-a853-942b06c9de69'::uuid, 'devon.peralta@organap.edu', 'Devon Peralta', '2027-0063', null, false, 'org_member', '4th Year Representative', 'cit-sbo'),
      ('0bcf2de8-1709-4a73-a6cb-f79e7071a7a8'::uuid, 'devon.salazar@organap.edu', 'Devon Salazar', '2027-0064', null, false, 'org_officer', 'Auditor', 'ruling-conquerors'),
      ('85967b69-c2a7-437d-bcb1-94497b566620'::uuid, 'ellis.alvarez@organap.edu', 'Ellis Alvarez', '2027-0065', null, false, 'org_member', 'Business Managers', 'psych-club'),
      ('736f9c4c-aafb-42cd-899b-9e9bcf6f4fb9'::uuid, 'ellis.bautista@organap.edu', 'Ellis Bautista', '2027-0066', null, false, 'org_member', 'Business Managers', 'psych-club'),
      ('bab76844-f121-4891-8d3b-f71438b1ac2b'::uuid, 'ellis.castillo@organap.edu', 'Ellis Castillo', '2027-0067', null, false, 'org_member', 'Features Editor', 'loquitor'),
      ('3b49310d-f7c7-412f-9d9d-636290e525cd'::uuid, 'ellis.delgado@organap.edu', 'Ellis Delgado', '2027-0068', null, false, 'org_member', 'Working Committees', 'gabay'),
      ('7a71b47e-6662-42dc-a78e-919ae998f7d2'::uuid, 'ellis.estrada@organap.edu', 'Ellis Estrada', '2027-0069', null, false, 'org_member', '2nd Year Representative', 'ccje-sbo'),
      ('cee25598-c1ac-4001-a271-e2827d7941c1'::uuid, 'ellis.ferrer@organap.edu', 'Ellis Ferrer', '2027-0070', null, false, 'org_member', '2nd Year Representative', 'ctela-sbo'),
      ('45e51748-cbcb-45a4-9e09-50f7b5c9d2ed'::uuid, 'ellis.gomez@organap.edu', 'Ellis Gomez', '2027-0071', null, false, 'org_member', '2nd Year Representative', 'cabm-sbo'),
      ('d7561eaf-6e50-4e60-933b-e56ddb3d9ecc'::uuid, 'ellis.hernandez@organap.edu', 'Ellis Hernandez', '2027-0072', null, false, 'org_member', '3rd Year Representative', 'cit-sbo'),
      ('bab09d6a-de7f-4fce-888c-2bf3afbfc455'::uuid, 'ellis.ibarra@organap.edu', 'Ellis Ibarra', '2027-0073', null, false, 'org_member', 'News Editor', 'loquitor'),
      ('cdbc6cd9-f765-48ba-adf7-db9583bcdee3'::uuid, 'ellis.jimenez@organap.edu', 'Ellis Jimenez', '2027-0074', null, false, 'org_officer', 'Speaker of the Parliament', 'ssc'),
      ('cf2f6b62-7be9-44cd-9cc2-34eb13ab92fd'::uuid, 'ellis.ledesma@organap.edu', 'Ellis Ledesma', '2027-0075', null, false, 'org_officer', 'Sports Council Convenor', 'ruling-conquerors'),
      ('c83aa015-3a73-4fff-a319-c155df6576c9'::uuid, 'ellis.marquez@organap.edu', 'Ellis Marquez', '2027-0076', null, false, 'org_member', '1st Year Representative', 'cabm-sbo'),
      ('a5a7b471-a5c8-4b56-b7ea-e539576d4e50'::uuid, 'ellis.nolasco@organap.edu', 'Ellis Nolasco', '2027-0077', null, false, 'org_member', '1st Year Representative', 'ctela-sbo'),
      ('ef6c75eb-f3f8-46bb-b8c2-9c015c3b3344'::uuid, 'ellis.ocampo@organap.edu', 'Ellis Ocampo', '2027-0078', null, false, 'org_member', '1st Year Representative', 'ccje-sbo'),
      ('22cd902a-d425-4f9c-bb83-68fbf42e8e0e'::uuid, 'ellis.peralta@organap.edu', 'Ellis Peralta', '2027-0079', null, false, 'org_member', '2nd Year Representative', 'cit-sbo'),
      ('25953337-c0c6-424e-a7ef-a2a1a97e47ff'::uuid, 'ellis.salazar@organap.edu', 'Ellis Salazar', '2027-0080', null, false, 'org_member', 'Ball Games Coordinator', 'ruling-conquerors'),
      ('31c851e4-c27e-43d2-b279-89545128d33c'::uuid, 'finley.alvarez@organap.edu', 'Finley Alvarez', '2027-0081', null, false, 'org_member', 'Combat Sports Coordinator', 'ruling-conquerors'),
      ('c5cede63-3e3f-4c02-9919-83bac49cbffc'::uuid, 'finley.bautista@organap.edu', 'Finley Bautista', '2027-0082', null, false, 'org_member', 'Development Communication Editor', 'loquitor'),
      ('64255b0a-de81-4b31-ae69-7e82e5b08499'::uuid, 'finley.castillo@organap.edu', 'Finley Castillo', '2027-0083', null, false, 'org_member', 'Esports Coordinator', 'ruling-conquerors'),
      ('18570e04-3a7e-442b-80ef-8076284d87c0'::uuid, 'finley.delgado@organap.edu', 'Finley Delgado', '2027-0084', null, false, 'org_member', 'Member of the Parliament', 'ssc'),
      ('4754c068-df17-416a-a4a7-40dc01af380c'::uuid, 'finley.estrada@organap.edu', 'Finley Estrada', '2027-0085', null, false, 'org_member', 'Member of the Parliament', 'ssc'),
      ('7518a558-cca2-4f6c-8094-508e3000334e'::uuid, 'finley.ferrer@organap.edu', 'Finley Ferrer', '2027-0086', null, false, 'org_member', 'Members of the Parliament', 'ssc'),
      ('dc8c2600-190c-4d3f-aeff-34441ae92455'::uuid, 'finley.gomez@organap.edu', 'Finley Gomez', '2027-0087', null, false, 'org_member', 'Members of the Parliament', 'ssc'),
      ('5636bf3a-66c7-4630-b53b-dbd2bbfe3b5b'::uuid, 'finley.hernandez@organap.edu', 'Finley Hernandez', '2027-0088', null, false, 'org_member', 'Members of the Parliament', 'ssc'),
      ('350315b7-95b8-495f-b90d-6c4361acb6ff'::uuid, 'finley.ibarra@organap.edu', 'Finley Ibarra', '2027-0089', null, false, 'org_member', 'Members of the Parliament', 'ssc'),
      ('076fac6f-a8b6-413e-9cd4-ad8a918e1814'::uuid, 'finley.jimenez@organap.edu', 'Finley Jimenez', '2027-0090', null, false, 'org_member', 'Members of the Parliament', 'ssc'),
      ('3a9beb45-bfb5-4871-b827-3949d52b1c00'::uuid, 'finley.ledesma@organap.edu', 'Finley Ledesma', '2027-0091', null, false, 'org_member', 'Members of the Parliament', 'ssc'),
      ('ffcfeb3d-52dd-4ebc-9e05-564653c7deec'::uuid, 'finley.marquez@organap.edu', 'Finley Marquez', '2027-0092', null, false, 'org_member', 'Racket Sports Coordinator', 'ruling-conquerors'),
      ('377bb6aa-80cb-4f14-a0c4-366e8516e666'::uuid, 'finley.nolasco@organap.edu', 'Finley Nolasco', '2027-0093', null, false, 'org_member', 'Weight Lifting Coordinator', 'ruling-conquerors'),
      ('e4862315-06a1-489c-9eff-6820ee0722f4'::uuid, 'finley.ocampo@organap.edu', 'Finley Ocampo', '2027-0094', null, false, 'org_member', '1st Year Representative', 'cit-sbo'),
      ('07f14153-6d37-42ad-a2bf-fed76acbe8e7'::uuid, 'finley.peralta@organap.edu', 'Finley Peralta', '2027-0095', null, false, 'org_member', 'Sports Editor', 'loquitor'),
      ('58905546-1d76-4eb9-94af-65c1dbbcf687'::uuid, 'finley.salazar@organap.edu', 'Finley Salazar', '2027-0096', null, false, 'org_member', 'Head Photo Journalist', 'loquitor'),
      ('893f4e69-b8fd-4822-b8d0-a3a93d0add8e'::uuid, 'harper.alvarez@organap.edu', 'Harper Alvarez', '2027-0097', null, false, 'org_member', 'Senior Broadcaster', 'loquitor')
    ) as t(id, email, display_name, school_id, avatar_url, is_staff, role_kind, title, org_slug)
  loop
    insert into auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change,
      email_change_token_current,
      phone_change,
      phone_change_token,
      reauthentication_token,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      is_sso_user,
      is_anonymous
    )
    values (
      '00000000-0000-0000-0000-000000000000'::uuid,
      v_rec.id,
      'authenticated',
      'authenticated',
      v_rec.email,
      v_password_hash,
      now(),
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '',
      '{"provider": "email", "providers": ["email"]}'::jsonb,
      jsonb_build_object(
        'sub', v_rec.id::text,
        'email', v_rec.email,
        'school_id', v_rec.school_id,
        'display_name', v_rec.display_name,
        'full_name', v_rec.display_name,
        'email_verified', true,
        'phone_verified', false
      ),
      now(),
      now(),
      false,
      false
    )
    on conflict (id) do update set
      email = excluded.email,
      encrypted_password = excluded.encrypted_password,
      email_confirmed_at = coalesce(auth.users.email_confirmed_at, now()),
      raw_user_meta_data = excluded.raw_user_meta_data,
      updated_at = now();

    insert into auth.identities (
      id,
      provider_id,
      user_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    values (
      gen_random_uuid(),
      v_rec.id::text,
      v_rec.id,
      jsonb_build_object(
        'sub', v_rec.id::text,
        'email', v_rec.email,
        'school_id', v_rec.school_id,
        'display_name', v_rec.display_name,
        'email_verified', false,
        'phone_verified', false
      ),
      'email',
      now(),
      now(),
      now()
    )
    on conflict (provider_id, provider) do update set
      identity_data = excluded.identity_data,
      updated_at = now();

    insert into public.profiles (
      id,
      display_name,
      school_id,
      avatar_url,
      is_staff,
      is_active,
      email
    )
    values (
      v_rec.id,
      v_rec.display_name,
      v_rec.school_id,
      v_rec.avatar_url,
      v_rec.is_staff,
      true,
      v_rec.email
    )
    on conflict (id) do update set
      display_name = excluded.display_name,
      school_id = excluded.school_id,
      avatar_url = excluded.avatar_url,
      is_staff = excluded.is_staff,
      is_active = true,
      email = excluded.email,
      updated_at = now();

    if v_rec.role_kind in ('osa_director', 'osa_personnel') then
      if v_group_students is not null then
        delete from public.user_groups
        where user_id = v_rec.id and group_id = v_group_students;
      end if;
      if v_group_sa is not null then
        insert into public.user_groups (user_id, group_id)
        values (v_rec.id, v_group_sa)
        on conflict do nothing;
      end if;
    elsif v_rec.role_kind in ('org_head', 'org_officer') then
      if v_group_students is not null then
        delete from public.user_groups
        where user_id = v_rec.id and group_id = v_group_students;
      end if;
      if v_group_officers is not null then
        insert into public.user_groups (user_id, group_id)
        values (v_rec.id, v_group_officers)
        on conflict do nothing;
      end if;
    else
      if v_group_students is not null then
        insert into public.user_groups (user_id, group_id)
        values (v_rec.id, v_group_students)
        on conflict do nothing;
      end if;
    end if;
  end loop;
end
$$;

-- -----------------------------------------------------------------------------
-- 3. Insert the 10 Recognized KCP Student Organizations
-- -----------------------------------------------------------------------------

insert into public.organizations (
  name,
  acronym,
  slug,
  description,
  category,
  logo_url,
  governor_id,
  is_active
)
values
  ('Supreme Student Council', 'SSC', 'ssc', 'Mother organization governing all student organizations at KCP', 'student_government', 'https://hmbwxmayosinqvzkktrm.supabase.co/storage/v1/render/image/public/soams-public-media/organization/org1/logo/a804ad92-ef70-46dd-95d9-207d5fe98fee-SSC.png?width=512&height=512&resize=contain&format=origin&quality=80', 'dfbf9e77-bfb1-4ee2-ada6-41fa743900c9'::uuid, true),
  ('The Loquitur', 'TL', 'loquitor', 'Official Student Publication of King''s College of the Philippines', 'special_interest', 'https://hmbwxmayosinqvzkktrm.supabase.co/storage/v1/render/image/public/soams-public-media/organization/org2/logo/b9cfff2e-bbe0-4e51-aeb2-681631a8e362-The_Loquitur.png?width=512&height=512&resize=contain&format=origin&quality=80', '362fa123-ae64-4dfa-87d8-07d471f32223'::uuid, true),
  ('Gabay Ensemble', 'GE', 'gabay', 'College Cultural Group of KCP', 'cultural', 'https://hmbwxmayosinqvzkktrm.supabase.co/storage/v1/render/image/public/soams-public-media/organization/org3/logo/cb9b7ab2-d6fe-411c-9ae4-b429ca1dce00-Gabay_Ensemble.png?width=512&height=512&resize=contain&format=origin&quality=80', '9e705766-aad8-48f1-8c22-372391b8a1cd'::uuid, true),
  ('The Ruling Conquerors', 'TRC', 'ruling-conquerors', 'Official Sports Club of KCP', 'sports', 'https://hmbwxmayosinqvzkktrm.supabase.co/storage/v1/render/image/public/soams-public-media/organization/org4/logo/7108a1f9-06c3-4528-ab9e-924d26ac6bd8-Sports_Club.png?width=512&height=512&resize=contain&format=origin&quality=80', 'a429c0f5-3de9-4ad4-b6e2-76f8f26780b9'::uuid, true),
  ('KCPEEP Facilitator', 'KCPEEP', 'psych-club', 'Student organization for Psychology learners and academic activities', 'academic', 'https://hmbwxmayosinqvzkktrm.supabase.co/storage/v1/render/image/public/soams-public-media/organization/org5/logo/8ac3b571-e3a5-4a80-b213-aa09a67c51e4-KCPeer_Facilitators.png?width=512&height=512&resize=contain&format=origin&quality=80', 'c2ff7929-5350-4178-a5aa-9bd5a405617e'::uuid, true),
  ('College of Accountancy and Business Management SBO', 'CABM SBO', 'cabm-sbo', 'Student Body Organization for the College of Accountancy and Business Management', 'academic', 'https://hmbwxmayosinqvzkktrm.supabase.co/storage/v1/render/image/public/soams-public-media/organization/org6/logo/e67bd7f1-5015-43ea-a0dd-78223e93b6d9-CABM_SBO.png?width=512&height=512&resize=contain&format=origin&quality=80', '7514a1e4-db97-4bea-a633-3b5a770332a3'::uuid, true),
  ('College of Criminal Justice Education SBO', 'CCJE SBO', 'ccje-sbo', 'Student Body Organization for the College of Criminal Justice Education', 'academic', 'https://hmbwxmayosinqvzkktrm.supabase.co/storage/v1/render/image/public/soams-public-media/organization/org7/logo/73970f96-f0d5-45ba-b44e-01a2f09c7791-CCJE_SBO.png?width=512&height=512&resize=contain&format=origin&quality=80', 'cd91be64-061c-48e6-b775-daeac506e775'::uuid, true),
  ('College of Information Technology SBO', 'CIT SBO', 'cit-sbo', 'Student''s Academic League of Technology (S-ALT)', 'academic', 'https://hmbwxmayosinqvzkktrm.supabase.co/storage/v1/render/image/public/soams-public-media/organization/org8/logo/f2a8f40b-26d1-4658-bd82-ae2ed3065370-S-ALT_SBO.png?width=512&height=512&resize=contain&format=origin&quality=80', '0a6408d9-bf2c-42ee-a1aa-4ff892218929'::uuid, true),
  ('College of Teacher Education and Liberal Arts SBO', 'CTELA SBO', 'ctela-sbo', 'Student Body Organization for CTELA', 'academic', 'https://hmbwxmayosinqvzkktrm.supabase.co/storage/v1/render/image/public/soams-public-media/organization/org9/logo/1c208ef3-f471-4dcc-9718-4f18053876dd-CTELA_SBO.png?width=512&height=512&resize=contain&format=origin&quality=80', '25c8f38f-5d8b-4441-a16d-9761312899ba'::uuid, true),
  ('College of Theology SBO', 'COT SBO', 'theology-sbo', 'Student Body Organization for the College of Theology', 'academic', 'https://hmbwxmayosinqvzkktrm.supabase.co/storage/v1/render/image/public/soams-public-media/organization/org10/logo/f3ec2844-b0db-4ec7-a34d-9a394c6ad112-COT_SBO.png?width=512&height=512&resize=contain&format=origin&quality=80', '8cd9411b-e9b3-4e28-aa92-11ed149c7563'::uuid, true)
on conflict (slug) do update set
  name = excluded.name,
  acronym = excluded.acronym,
  description = excluded.description,
  category = excluded.category,
  logo_url = excluded.logo_url,
  governor_id = excluded.governor_id,
  is_active = true,
  updated_at = now();

-- -----------------------------------------------------------------------------
-- 4. Link All 97 Officers & Members to Their KCP Student Organizations
-- -----------------------------------------------------------------------------

do $$
declare
  v_rec record;
  v_org_id uuid;
begin
  for v_rec in
    select *
    from (
      values
        ('gabay', '9e705766-aad8-48f1-8c22-372391b8a1cd'::uuid, 'Chieftain', true),
        ('loquitor', '362fa123-ae64-4dfa-87d8-07d471f32223'::uuid, 'Editor-in-Chief', true),
        ('ccje-sbo', 'cd91be64-061c-48e6-b775-daeac506e775'::uuid, 'Governor', true),
        ('cabm-sbo', '7514a1e4-db97-4bea-a633-3b5a770332a3'::uuid, 'Governor', true),
        ('ctela-sbo', '25c8f38f-5d8b-4441-a16d-9761312899ba'::uuid, 'Governor', true),
        ('theology-sbo', '8cd9411b-e9b3-4e28-aa92-11ed149c7563'::uuid, 'Governor', true),
        ('cit-sbo', '0a6408d9-bf2c-42ee-a1aa-4ff892218929'::uuid, 'Governor', true),
        ('ruling-conquerors', 'a429c0f5-3de9-4ad4-b6e2-76f8f26780b9'::uuid, 'President', true),
        ('psych-club', 'c2ff7929-5350-4178-a5aa-9bd5a405617e'::uuid, 'President', true),
        ('ssc', 'dfbf9e77-bfb1-4ee2-ada6-41fa743900c9'::uuid, 'Prime Minister', true),
        ('loquitor', '241af3b6-fa34-433a-b224-0ca63d3cc2e6'::uuid, 'Associate Editor', true),
        ('ssc', 'a2680327-9cf8-4b59-b1a7-b86e02ac82f5'::uuid, 'Deputy Prime Minister', true),
        ('gabay', '58c122c4-fba0-493b-a423-3e457101bd97'::uuid, 'Vice Chieftain', true),
        ('ccje-sbo', '711ccc3e-3483-4464-8f99-f25f5925b6c0'::uuid, 'Vice Governor', true),
        ('ctela-sbo', '3587abf9-369f-4e23-9161-c3dea49dadf9'::uuid, 'Vice Governor', true),
        ('cit-sbo', '1d2e7668-e065-4dde-98b7-5034d9bf3516'::uuid, 'Vice Governor', true),
        ('theology-sbo', 'cc679ef8-79b1-4e88-ac74-b3f7f2240263'::uuid, 'Vice Governor', true),
        ('cabm-sbo', 'fb03dc88-51bf-464f-8aac-b15c7ff6731a'::uuid, 'Vice Governor', true),
        ('psych-club', '072bc94b-f5b4-443e-b52a-28d7fba8844b'::uuid, 'Vice President', true),
        ('ruling-conquerors', 'df0636cd-d07e-4c8f-97c7-81c82aebb144'::uuid, 'Vice President for Internal Affairs', true),
        ('loquitor', '9d1e9908-f42e-446a-8564-f60eb6181c53'::uuid, 'Finance Manager', true),
        ('ccje-sbo', '65eb1ef9-a87e-4ae8-afc8-63594d0f94da'::uuid, 'Secretary', true),
        ('gabay', '31967f70-20c3-477c-913c-8cdd9c6bd093'::uuid, 'Secretary', true),
        ('ssc', 'f63ff257-227a-4b62-813c-c87bee7ab955'::uuid, 'Secretary', true),
        ('ctela-sbo', '6f645613-2a4e-445d-96a7-a40693e277b2'::uuid, 'Secretary', true),
        ('cit-sbo', 'e52c4d52-278f-4ec6-b369-9337e31ef696'::uuid, 'Secretary', true),
        ('psych-club', '47657994-fd3f-408e-a7d9-0d6c2ed7caac'::uuid, 'Secretary', true),
        ('cabm-sbo', '30c8f2b4-7d15-4698-8b72-36097a19f043'::uuid, 'Secretary', true),
        ('theology-sbo', '3f58838b-232c-4229-80a7-9908c5c63698'::uuid, 'Secretary', true),
        ('ruling-conquerors', '19e0654d-5223-42ef-b8d9-27ef6c07775f'::uuid, 'Vice President for External Affairs', true),
        ('gabay', '64aab1ec-e211-41bf-9707-a64e7978e333'::uuid, 'Assistant Secretary', true),
        ('ssc', '25c711c7-a3bc-4d8c-bac0-181311056fd2'::uuid, 'Assistant Secretary', true),
        ('psych-club', 'c49d28fc-62e7-4199-b166-813e2bf8bfe4'::uuid, 'Assistant Secretary', true),
        ('cit-sbo', 'c9836097-df7e-4e69-9c43-579e1b43d90f'::uuid, 'Assistant Secretary', true),
        ('loquitor', '3260ba45-489c-417a-9e6f-cdb8d9aeef6b'::uuid, 'Managing Editor', true),
        ('ruling-conquerors', '94b5c3ef-9cf6-4d2e-a1e8-d8f3b0103a98'::uuid, 'Secretary', true),
        ('ccje-sbo', 'e37b844c-9717-4901-a382-abd92161b8f3'::uuid, 'Treasurer', true),
        ('theology-sbo', 'c1ad8ef5-a00f-4027-8cd2-d489a9355223'::uuid, 'Treasurer', true),
        ('cabm-sbo', '66ea0853-75fc-4398-8037-99eb0cc09f6b'::uuid, 'Treasurer', true),
        ('ctela-sbo', 'c590328b-bd40-4887-ab33-c25ead97d8fb'::uuid, 'Treasurer', true),
        ('ruling-conquerors', '3b78f198-2a01-419b-bb17-d866da3891cd'::uuid, 'Assistant Secretary', true),
        ('theology-sbo', '36eb2193-8a40-4e3f-8e05-595a7f3c6a3c'::uuid, 'Auditor', true),
        ('cabm-sbo', '281a3239-f15f-430f-be31-b24eadb6f60e'::uuid, 'Auditor', true),
        ('ccje-sbo', '75f3f81d-7fb3-4d5e-95a9-4b492295cdb0'::uuid, 'Auditor', true),
        ('ctela-sbo', 'd7b0dd7d-5796-4b54-884b-ffeda01c8b01'::uuid, 'Auditor', true),
        ('loquitor', 'e6cedf00-b8b9-4384-a0a8-88eda6d248f5'::uuid, 'Head Cartoonist', false),
        ('ssc', '6c62f7b5-4eb2-48ac-a8fb-878f9bdfbdd2'::uuid, 'Minister of Finance', true),
        ('psych-club', '40ead038-42ab-45e6-bce1-6a58c0cb44b5'::uuid, 'Treasurer', true),
        ('cit-sbo', '3ddc92c1-2255-4b91-b05a-d88cce87b25a'::uuid, 'Treasurer', true),
        ('gabay', 'f1bc001b-0b2d-4a44-bc2f-f213c7c0a397'::uuid, 'Treasurer', true),
        ('cabm-sbo', '898c5fbc-0ab8-42c6-b111-0ad3a83b081e'::uuid, '4th Year Representative', false),
        ('ctela-sbo', '7836762e-60c6-4592-8b3e-3601762fa2a2'::uuid, '4th Year Representative', false),
        ('ccje-sbo', '7aedd945-bb15-41df-a218-a13c070943e8'::uuid, '4th Year Representative', false),
        ('gabay', '57c186a7-a1ce-4ecb-bfc7-94b7f6e29ecc'::uuid, 'Auditor', true),
        ('cit-sbo', 'dc5a196c-e3e0-49dd-a0d0-3009332da2b6'::uuid, 'Auditor', true),
        ('psych-club', 'e010106a-cf5d-4b62-ba46-084ed92dec2f'::uuid, 'Auditor', true),
        ('loquitor', 'd1abc306-266e-4bee-bd9c-99eeab37a864'::uuid, 'Graphics and Layout Editor', false),
        ('ssc', 'ff3d541e-ba72-4013-a33e-62d8513d38d2'::uuid, 'Minister of Internal Affairs', true),
        ('ruling-conquerors', '5c58dcea-9fb9-4af5-9775-542b7646155f'::uuid, 'Treasurer', true),
        ('ccje-sbo', 'e611d66d-8653-41ee-b3f7-0f7a94883232'::uuid, '3rd Year Representative', false),
        ('ctela-sbo', 'bd4a3601-9db8-48c2-bf43-445bc2efd9f7'::uuid, '3rd Year Representative', false),
        ('cabm-sbo', 'a4da4eb5-e6fc-43c5-a5db-e93d0f3c8476'::uuid, '3rd Year Representative', false),
        ('cit-sbo', '44ffe800-ac3b-42c7-a853-942b06c9de69'::uuid, '4th Year Representative', false),
        ('ruling-conquerors', '0bcf2de8-1709-4a73-a6cb-f79e7071a7a8'::uuid, 'Auditor', true),
        ('psych-club', '85967b69-c2a7-437d-bcb1-94497b566620'::uuid, 'Business Managers', false),
        ('psych-club', '736f9c4c-aafb-42cd-899b-9e9bcf6f4fb9'::uuid, 'Business Managers', false),
        ('loquitor', 'bab76844-f121-4891-8d3b-f71438b1ac2b'::uuid, 'Features Editor', false),
        ('gabay', '3b49310d-f7c7-412f-9d9d-636290e525cd'::uuid, 'Working Committees', false),
        ('ccje-sbo', '7a71b47e-6662-42dc-a78e-919ae998f7d2'::uuid, '2nd Year Representative', false),
        ('ctela-sbo', 'cee25598-c1ac-4001-a271-e2827d7941c1'::uuid, '2nd Year Representative', false),
        ('cabm-sbo', '45e51748-cbcb-45a4-9e09-50f7b5c9d2ed'::uuid, '2nd Year Representative', false),
        ('cit-sbo', 'd7561eaf-6e50-4e60-933b-e56ddb3d9ecc'::uuid, '3rd Year Representative', false),
        ('loquitor', 'bab09d6a-de7f-4fce-888c-2bf3afbfc455'::uuid, 'News Editor', false),
        ('ssc', 'cdbc6cd9-f765-48ba-adf7-db9583bcdee3'::uuid, 'Speaker of the Parliament', true),
        ('ruling-conquerors', 'cf2f6b62-7be9-44cd-9cc2-34eb13ab92fd'::uuid, 'Sports Council Convenor', true),
        ('cabm-sbo', 'c83aa015-3a73-4fff-a319-c155df6576c9'::uuid, '1st Year Representative', false),
        ('ctela-sbo', 'a5a7b471-a5c8-4b56-b7ea-e539576d4e50'::uuid, '1st Year Representative', false),
        ('ccje-sbo', 'ef6c75eb-f3f8-46bb-b8c2-9c015c3b3344'::uuid, '1st Year Representative', false),
        ('cit-sbo', '22cd902a-d425-4f9c-bb83-68fbf42e8e0e'::uuid, '2nd Year Representative', false),
        ('ruling-conquerors', '25953337-c0c6-424e-a7ef-a2a1a97e47ff'::uuid, 'Ball Games Coordinator', false),
        ('ruling-conquerors', '31c851e4-c27e-43d2-b279-89545128d33c'::uuid, 'Combat Sports Coordinator', false),
        ('loquitor', 'c5cede63-3e3f-4c02-9919-83bac49cbffc'::uuid, 'Development Communication Editor', false),
        ('ruling-conquerors', '64255b0a-de81-4b31-ae69-7e82e5b08499'::uuid, 'Esports Coordinator', false),
        ('ssc', '18570e04-3a7e-442b-80ef-8076284d87c0'::uuid, 'Member of the Parliament', false),
        ('ssc', '4754c068-df17-416a-a4a7-40dc01af380c'::uuid, 'Member of the Parliament', false),
        ('ssc', '7518a558-cca2-4f6c-8094-508e3000334e'::uuid, 'Members of the Parliament', false),
        ('ssc', 'dc8c2600-190c-4d3f-aeff-34441ae92455'::uuid, 'Members of the Parliament', false),
        ('ssc', '5636bf3a-66c7-4630-b53b-dbd2bbfe3b5b'::uuid, 'Members of the Parliament', false),
        ('ssc', '350315b7-95b8-495f-b90d-6c4361acb6ff'::uuid, 'Members of the Parliament', false),
        ('ssc', '076fac6f-a8b6-413e-9cd4-ad8a918e1814'::uuid, 'Members of the Parliament', false),
        ('ssc', '3a9beb45-bfb5-4871-b827-3949d52b1c00'::uuid, 'Members of the Parliament', false),
        ('ruling-conquerors', 'ffcfeb3d-52dd-4ebc-9e05-564653c7deec'::uuid, 'Racket Sports Coordinator', false),
        ('ruling-conquerors', '377bb6aa-80cb-4f14-a0c4-366e8516e666'::uuid, 'Weight Lifting Coordinator', false),
        ('cit-sbo', 'e4862315-06a1-489c-9eff-6820ee0722f4'::uuid, '1st Year Representative', false),
        ('loquitor', '07f14153-6d37-42ad-a2bf-fed76acbe8e7'::uuid, 'Sports Editor', false),
        ('loquitor', '58905546-1d76-4eb9-94af-65c1dbbcf687'::uuid, 'Head Photo Journalist', false),
        ('loquitor', '893f4e69-b8fd-4822-b8d0-a3a93d0add8e'::uuid, 'Senior Broadcaster', false)
    ) as m(org_slug, user_id, position_title, is_officer)
  loop
    select id into v_org_id from public.organizations where slug = v_rec.org_slug limit 1;
    if v_org_id is not null then
      insert into public.organization_members (
        organization_id,
        user_id,
        position,
        position_title,
        is_officer,
        is_adviser
      )
      values (
        v_org_id,
        v_rec.user_id,
        v_rec.position_title,
        v_rec.position_title,
        v_rec.is_officer,
        false
      )
      on conflict (organization_id, user_id) do update set
        position = excluded.position,
        position_title = excluded.position_title,
        is_officer = excluded.is_officer,
        is_adviser = excluded.is_adviser;
    end if;
  end loop;
end
$$;

-- -----------------------------------------------------------------------------
-- 5. Remove Placeholder OSAS Director (100000) & Unaffiliated Students
-- -----------------------------------------------------------------------------

delete from auth.users u
using public.profiles p
where u.id = p.id
  and (
    p.school_id = '100000'
    or lower(coalesce(u.email, '')) = 'osasdirector@gmail.com'
    or (
      p.is_superuser = false
      and p.is_staff = false
      and not exists (
        select 1
        from public.organization_members om
        where om.user_id = p.id
      )
      and not exists (
        select 1
        from public.organizations o
        where o.governor_id = p.id
           or o.adviser_id = p.id
      )
    )
  );
