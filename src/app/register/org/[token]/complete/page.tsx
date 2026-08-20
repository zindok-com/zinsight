export default function OrgRegisterCompletePage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
            <div className="max-w-md w-full text-center space-y-5 bg-white rounded-2xl shadow-sm p-10">
                <div className="text-6xl">✅</div>
                <h1 className="text-2xl font-bold text-gray-900">등록 신청이 완료되었습니다!</h1>
                <p className="text-sm text-gray-500 leading-relaxed">
                    제출해 주신 조직 정보를 담당자가 검토 후 서비스에 등록해 드립니다.
                    <br />
                    영업일 기준 1~2일 내에 처리됩니다.
                </p>
                <div className="pt-2 p-4 bg-blue-50 rounded-xl text-xs text-blue-700 text-left space-y-1">
                    <p className="font-semibold">📌 안내사항</p>
                    <p>• 등록 완료 후 지인사이트 레이더 서비스에서 조직 프로필을 확인할 수 있습니다.</p>
                    <p>• 정보 수정이 필요하면 담당자에게 직접 문의해 주세요.</p>
                </div>
            </div>
        </div>
    );
}