import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
  render,
} from '@react-email/components'

const brand = '#c39341'

interface VerifyEmailProps {
  url: string
  userName?: string | undefined
}

export const VerifyEmail = ({ url, userName }: VerifyEmailProps) => (
  <Html>
    <Head />
    <Preview>Verifikasi email akun TrainerHub Anda</Preview>
    <Tailwind>
      <Body className="bg-white font-sans">
        <Container className="mx-auto max-w-[560px] px-6 py-10">
          <Section className="mb-8">
            <Text className="text-2xl font-bold m-0" style={{ color: brand }}>
              TrainerHub
            </Text>
          </Section>

          <Section className="bg-[#fdf8ee] rounded-xl px-8 py-8 mb-6">
            <Heading className="text-[28px] font-semibold text-gray-900 mt-0 mb-3">
              Verifikasi email Anda
            </Heading>
            <Text className="text-[16px] text-gray-600 mt-0 mb-6">
              {userName ? `Halo ${userName}, ` : ''}Terima kasih telah mendaftar di TrainerHub.
              Klik tombol di bawah untuk memverifikasi alamat email Anda.
            </Text>
            <Button
              href={url}
              className="rounded-lg px-6 py-3 text-white text-[15px] font-semibold"
              style={{ backgroundColor: brand }}
            >
              Verifikasi Email
            </Button>
            <Text className="text-[13px] text-gray-500 mt-6 mb-0">
              Jika Anda tidak mendaftar di TrainerHub, abaikan email ini.
            </Text>
          </Section>

          <Section className="mb-8">
            <Text className="text-[13px] text-gray-500 m-0">
              Atau salin link ini ke browser Anda:
            </Text>
            <Text className="text-[13px] m-0" style={{ color: '#a67c3d' }}>
              {url}
            </Text>
          </Section>

          <Section>
            <Text className="text-[12px] text-gray-400 m-0">
              © {new Date().getFullYear()} TrainerHub · sertifikasitrainer.com
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)

export async function renderVerifyEmail(props: VerifyEmailProps): Promise<string> {
  return render(<VerifyEmail {...props} />)
}
