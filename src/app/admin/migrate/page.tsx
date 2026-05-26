'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { migrateMagazineContent } from '@/actions/admin/magazine-actions';
import { toast } from 'sonner';
import { Loader2, Database } from 'lucide-react';

export default function MigratePage() {
    const [isPending, setIsPending] = useState(false);

    const handleMigrate = async () => {
        if (!confirm('정말 모든 매거진 데이터를 마이그레이션 하시겠습니까?')) return;
        
        setIsPending(true);
        try {
            const res = await migrateMagazineContent();
            if (res.success) {
                toast.success('마이그레이션이 완료되었습니다!');
            } else {
                toast.error('오류 발생: ' + res.error);
            }
        } catch (error: any) {
            toast.error('시스템 오류: ' + error.message);
        } finally {
            setIsPending(false);
        }
    };

    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="bg-white p-8 rounded-xl border shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                        <Database className="w-6 h-6" />
                    </div>
                    <h1 className="text-2xl font-bold">콘텐츠 구조화 마이그레이션</h1>
                </div>
                
                <div className="space-y-4 mb-8 text-slate-600">
                    <p>기존의 텍스트 기반 매거진 본문 데이터를 새로운 <strong>JSON 구조화 데이터</strong>로 변환합니다.</p>
                    <ul className="list-disc list-inside space-y-2 text-sm">
                        <li>본문 내 섹션 마커(리드, 본문 N, 클로징)를 인식하여 분리합니다.</li>
                        <li>리드 섹션의 텍스트를 자동으로 요약(summary) 필드에 채웁니다.</li>
                        <li>이미 구조화된 데이터는 건너뜁니다.</li>
                    </ul>
                </div>

                <Button 
                    onClick={handleMigrate} 
                    disabled={isPending}
                    className="w-full h-12 bg-indigo-600 hover:bg-indigo-700"
                >
                    {isPending ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            마이그레이션 진행 중...
                        </>
                    ) : (
                        '데이터 변환 시작'
                    )}
                </Button>
            </div>
        </div>
    );
}
