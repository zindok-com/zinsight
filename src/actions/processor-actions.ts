'use server';

import { revalidatePath } from 'next/cache';

export interface ProcessResult {
    success: boolean;
    processedCount: number;
    newEntitiesCount: number;
    message: string;
}

/**
 * 수집된 뉴스 기사(UNKNOWN 상태)를 분석하여 기업(Entity)을 추출하고 연결합니다.
 */
export async function processNewsAction(): Promise<ProcessResult> {
    return {
        success: true,
        processedCount: 0,
        newEntitiesCount: 0,
        message: '현재 데이터 가공 알고리즘이 준비되지 않았습니다. (고도화 예정)'
    };
}
