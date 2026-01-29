// 데이터 가공 알고리즘 고도화를 위해 기존 코드를 제거했습니다.
// 추후 새로운 알고리즘을 이 서비스에 구현할 예정입니다.
export class ProcessorService {
    private static instance: ProcessorService;
    private constructor() { }
    public static getInstance(): ProcessorService {
        if (!ProcessorService.instance) {
            ProcessorService.instance = new ProcessorService();
        }
        return ProcessorService.instance;
    }
}
