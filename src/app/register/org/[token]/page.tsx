import { getInviteByToken } from '@/actions/company-actions';
import { OrgRegisterForm } from './OrgRegisterForm';

interface Props {
    params: Promise<{ token: string }>;
}

export default async function OrgRegisterPage({ params }: Props) {
    const { token } = await params;
    const result = await getInviteByToken(token);

    if (!result.valid) {
        const messages: Record<string, { title: string; desc: string }> = {
            NOT_FOUND: { title: '유효하지 않은 링크입니다', desc: '링크 주소를 다시 확인해 주세요.' },
            USED: { title: '이미 사용된 링크입니다', desc: '이 링크를 통한 조직 정보 등록이 이미 완료되었습니다. 추가 등록이 필요하시면 담당자에게 문의해 주세요.' },
            EXPIRED: { title: '링크가 만료되었습니다', desc: '이 링크의 유효기간이 지났습니다. 담당자에게 새 링크를 요청해 주세요.' },
        };
        const msg = messages[result.reason] ?? messages['NOT_FOUND'];
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
                <div className="max-w-md w-full text-center space-y-4 bg-white rounded-2xl shadow-sm p-10">
                    <div className="text-5xl">🔒</div>
                    <h1 className="text-xl font-bold text-gray-900">{msg.title}</h1>
                    <p className="text-sm text-gray-500 leading-relaxed">{msg.desc}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="text-center space-y-2">
                    <h1 className="text-2xl font-bold text-gray-900">조직 정보 등록</h1>
                    <p className="text-sm text-gray-500">
                        아래 양식을 작성해 주시면 담당자가 검토 후 등록을 완료해 드립니다.
                    </p>
                    <span className="inline-block text-xs bg-blue-50 text-blue-700 px-3 py-1 rounded-full border border-blue-200">
                        {result.invite.region.name} 지역
                    </span>
                </div>
                <OrgRegisterForm token={token} />
            </div>
        </div>
    );
}