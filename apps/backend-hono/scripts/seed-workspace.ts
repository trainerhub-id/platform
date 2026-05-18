import { db } from '../src/db/client'
import {
  batchTiers,
  batchTraining,
  courses,
  dokumenKategori,
  dokumenJenis,
  dokumenJenisProgram,
  peserta,
  pesertaBatch,
  sertifikat,
  todos,
  users,
  workspaces,
} from '../src/db/schema'
import { and, eq } from 'drizzle-orm'
import { generateWorkspaceSlug } from '../src/workspace/slug-generator'

async function main() {
  const userId = 'seed-user-1'
  const userEmail = 'seed-user-1@example.com'

  // 1. Ensure user (Better Auth user)
  const existingUser = await db.select().from(users).where(eq(users.id, userId)).limit(1)
  if (existingUser.length === 0) {
    await db.insert(users).values({
      id: userId,
      name: 'Seed User',
      email: userEmail,
      emailVerified: true,
      role: 'user',
    })
    console.log('[seed-workspace] created user seed-user-1')
  } else {
    console.log('[seed-workspace] user seed-user-1 already exists')
  }

  // 2. Ensure peserta linked
  const existingPeserta = await db
    .select()
    .from(peserta)
    .where(eq(peserta.clerkId, userId))
    .limit(1)
  let pesertaRow = existingPeserta[0]
  if (!pesertaRow) {
    const [created] = await db
      .insert(peserta)
      .values({
        clerkId: userId,
        nama: 'Seed User',
        email: userEmail,
        paymentStatus: 'paid',
      })
      .returning()
    pesertaRow = created
    console.log('[seed-workspace] created peserta')
  } else {
    console.log('[seed-workspace] peserta already exists')
  }

  // 3. Ensure course
  let courseRow = (
    await db.select().from(courses).where(eq(courses.shortCode, 'trainers')).limit(1)
  )[0]
  if (!courseRow) {
    const [created] = await db
      .insert(courses)
      .values({
        shortCode: 'trainers',
        title: 'Training for Trainers',
      })
      .returning()
    courseRow = created
    console.log('[seed-workspace] created course trainers')
  } else {
    console.log('[seed-workspace] course trainers already exists')
  }

  // 4. Ensure batch
  let batchRow = (
    await db
      .select()
      .from(batchTraining)
      .where(eq(batchTraining.slug, 'trainers-batch-1-seed'))
      .limit(1)
  )[0]
  if (!batchRow) {
    const [created] = await db
      .insert(batchTraining)
      .values({
        namaBatch: 'Training for Trainers - Batch 1',
        slug: 'trainers-batch-1-seed',
        batchNumber: 1,
        tanggal: new Date('2026-06-01'),
        courseId: courseRow.id,
        status: 'published',
      })
      .returning()
    batchRow = created
    console.log('[seed-workspace] created batch trainers-batch-1-seed')
  } else {
    console.log('[seed-workspace] batch trainers-batch-1-seed already exists')
  }

  // 5. Ensure tier (Platinum)
  let tierRow = (
    await db
      .select()
      .from(batchTiers)
      .where(eq(batchTiers.slug, 'platinum-seed'))
      .limit(1)
  )[0]
  if (!tierRow) {
    const [created] = await db
      .insert(batchTiers)
      .values({
        batchId: batchRow.id,
        name: 'Platinum',
        slug: 'platinum-seed',
        price: 5470000,
      })
      .returning()
    tierRow = created
    console.log('[seed-workspace] created tier platinum-seed')
  } else {
    console.log('[seed-workspace] tier platinum-seed already exists')
  }

  // 6. Ensure enrollment paid
  let enrollment = (
    await db
      .select()
      .from(pesertaBatch)
      .where(eq(pesertaBatch.pesertaId, pesertaRow.id))
      .limit(1)
  )[0]
  if (!enrollment) {
    const [created] = await db
      .insert(pesertaBatch)
      .values({
        pesertaId: pesertaRow.id,
        batchId: batchRow.id,
        tierId: tierRow.id,
        paymentStatus: 'paid',
        status: 'active',
      })
      .returning()
    enrollment = created
    console.log('[seed-workspace] created enrollment')
  } else {
    console.log('[seed-workspace] enrollment already exists')
  }

  // 7. Ensure workspace
  const existingWs = await db
    .select()
    .from(workspaces)
    .where(eq(workspaces.enrollmentId, enrollment.id))
    .limit(1)
  let workspaceId: string
  if (existingWs.length === 0) {
    const slug = generateWorkspaceSlug({
      batchNumber: batchRow.batchNumber,
      courseShortCode: courseRow.shortCode,
    })
    const [wsRow] = await db.insert(workspaces).values({
      slug,
      userId,
      pesertaId: pesertaRow.id,
      enrollmentId: enrollment.id,
      batchId: batchRow.id,
      courseId: courseRow.id,
      displayName: `${courseRow.title} - Batch ${batchRow.batchNumber}`,
      status: 'active',
    }).returning()
    workspaceId = wsRow.id
    console.log(`[seed-workspace] created workspace ${slug} for ${userEmail}`)
  } else {
    workspaceId = existingWs[0].id
    console.log(`[seed-workspace] workspace already exists for enrollment ${enrollment.id}`)
  }

  // 8. Seed dokumen kategori, jenis, and jenis-program mapping
  let kategoriRow = (
    await db
      .select()
      .from(dokumenKategori)
      .where(eq(dokumenKategori.nama, 'Persyaratan Trainer'))
      .limit(1)
  )[0]
  if (!kategoriRow) {
    const [created] = await db
      .insert(dokumenKategori)
      .values({ nama: 'Persyaratan Trainer' })
      .returning()
    kategoriRow = created
    console.log('[seed-workspace] created dokumen kategori: Persyaratan Trainer')
  } else {
    console.log('[seed-workspace] dokumen kategori already exists')
  }

  const jenisDefinitions = [
    { namaJenis: 'KTP', opsional: false, orderIndex: 1 },
    { namaJenis: 'NPWP', opsional: true, orderIndex: 2 },
    { namaJenis: 'Foto Profesional', opsional: false, orderIndex: 3 },
    { namaJenis: 'Surat Pernyataan Komitmen', opsional: false, orderIndex: 4 },
  ]

  for (const def of jenisDefinitions) {
    let jenisRow = (
      await db
        .select()
        .from(dokumenJenis)
        .where(
          and(
            eq(dokumenJenis.kategoriId, kategoriRow.id),
            eq(dokumenJenis.namaJenis, def.namaJenis),
          ),
        )
        .limit(1)
    )[0]
    if (!jenisRow) {
      const [created] = await db
        .insert(dokumenJenis)
        .values({
          kategoriId: kategoriRow.id,
          namaJenis: def.namaJenis,
          opsional: def.opsional,
        })
        .returning()
      jenisRow = created
      console.log(`[seed-workspace] created dokumen jenis: ${def.namaJenis}`)
    } else {
      console.log(`[seed-workspace] dokumen jenis ${def.namaJenis} already exists`)
    }

    // Junction: map jenis to trainers course
    const existingJunction = await db
      .select()
      .from(dokumenJenisProgram)
      .where(
        and(
          eq(dokumenJenisProgram.jenisId, jenisRow.id),
          eq(dokumenJenisProgram.courseId, courseRow.id),
        ),
      )
      .limit(1)
    if (existingJunction.length === 0) {
      await db.insert(dokumenJenisProgram).values({
        jenisId: jenisRow.id,
        courseId: courseRow.id,
        orderIndex: def.orderIndex,
        required: !def.opsional,
      })
      console.log(`[seed-workspace] mapped ${def.namaJenis} to trainers course`)
    } else {
      console.log(`[seed-workspace] junction ${def.namaJenis}->trainers already exists`)
    }
  }

  // 11. Seed sample todos
  const todoDefinitions = [
    { key: 'upload_dokumen', title: 'Upload dokumen persyaratan', category: 'Pra-Training' as const, isBlocking: true },
    { key: 'lakukan_pembayaran', title: 'Lakukan pembayaran', category: 'Pra-Training' as const, isBlocking: true },
  ]
  for (const def of todoDefinitions) {
    const [existing] = await db
      .select()
      .from(todos)
      .where(and(eq(todos.workspaceId, workspaceId), eq(todos.key, def.key)))
      .limit(1)
    if (!existing) {
      await db.insert(todos).values({
        workspaceId,
        userId,
        key: def.key,
        title: def.title,
        category: def.category,
        status: 'todo',
        isBlocking: def.isBlocking,
      })
      console.log(`[seed-workspace] created todo ${def.key}`)
    } else {
      console.log(`[seed-workspace] todo ${def.key} already exists`)
    }
  }

  // 12. Seed sertifikat
  const [existingCert] = await db
    .select()
    .from(sertifikat)
    .where(and(eq(sertifikat.workspaceId, workspaceId), eq(sertifikat.type, 'trainerhub')))
    .limit(1)
  if (!existingCert) {
    await db.insert(sertifikat).values({
      pesertaId: pesertaRow.id,
      workspaceId,
      courseId: courseRow.id,
      type: 'trainerhub',
      status: 'not_submitted',
      pesertaName: pesertaRow.nama,
      courseName: courseRow.title,
    })
    console.log('[seed-workspace] created sertifikat placeholder')
  } else {
    console.log('[seed-workspace] sertifikat already exists')
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
