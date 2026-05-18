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

const brand = '#c39341' // orange-500
const brandDark = '#a67c3d' // orange-600

interface PasswordResetEmailProps {
  url: string
  userName?: string | undefined
}

export const PasswordResetEmail = ({ url, userName }: PasswordResetEmailProps) => (
  <Html>
    <Head />
    <Preview>Reset password akun TrainerHub Anda</Preview>
    <Tailwind>
      <Body className="bg-white font-sans">
        <Container className="mx-auto max-w-[560px] px-6 py-10">
          {/* Logo */}
          <Section className="mb-8">
            <Text
              className="text-2xl font-bold m-0"
              style={{ color: brand }}
            >
              TrainerHub
            </Text>
          </Section>

          {/* Main */}
          <Section className="bg-[#fdf8ee] rounded-xl px-8 py-8 mb-6">
            <Heading className="text-[28px] font-semibold text-gray-900 mt-0 mb-3">
              Reset password Anda
            </Heading>
            <Text className="text-[16px] text-gray-600 mt-0 mb-6">
              {userName ? `Halo ${userName}, ` : ''}Seseorang meminta link untuk mengubah password
              akun Anda. Klik tombol di bawah untuk melanjutkan.
            </Text>
            <Button
              href={url}
              className="rounded-lg px-6 py-3 text-white text-[15px] font-semibold"
              style={{ backgroundColor: brand }}
            >
              Reset Password
            </Button>
            <Text className="text-[13px] text-gray-500 mt-6 mb-0">
              Jika Anda tidak meminta ini, abaikan email ini. Password Anda tidak akan berubah.
            </Text>
          </Section>

          {/* Link fallback */}
          <Section className="mb-8">
            <Text className="text-[13px] text-gray-500 m-0">
              Atau salin link ini ke browser Anda:
            </Text>
            <Text className="text-[13px] m-0" style={{ color: brandDark }}>
              {url}
            </Text>
          </Section>

          {/* Footer */}
          <Section>
            <Text className="text-[12px] text-gray-400 m-0">
              © {new Date().getFullYear()} TrainerHub · sertifikasitrainer.com
            </Text>
            <Text className="text-[12px] text-gray-400 mt-1 mb-0">
              Link ini berlaku selama 1 jam.
            </Text>
          </Section>
        </Container>
      </Body>
    </Tailwind>
  </Html>
)

export async function renderPasswordResetEmail(props: PasswordResetEmailProps): Promise<string> {
  return render(<PasswordResetEmail {...props} />)
}
