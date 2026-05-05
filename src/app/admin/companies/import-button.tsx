'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  Loader2, 
  ClipboardPaste, 
  FileJson 
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export function ImportButton() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [open, setOpen] = useState(false);
  const [importMode, setImportMode] = useState<'file' | 'text'>('file');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleImport = async (data: any) => {
    setIsProcessing(true);
    try {
      const response = await fetch('/api/companies/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (response.ok) {
        alert(`가져오기 성공!\n추가된 기업: ${result.results.addedCompanies}\n업데이트된 기업: ${result.results.updatedCompanies}\n추가된 기사 연결: ${result.results.addedArticles}`);
        setOpen(false);
        setJsonText('');
        router.refresh();
      } else {
        alert(`오류 발생: ${result.error}`);
      }
    } catch (error: any) {
      alert(`요청 중 오류 발생: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const jsonData = JSON.parse(text);
      await handleImport(jsonData);
    } catch (error: any) {
      alert(`파일 읽기 오류: ${error.message}`);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleTextImport = async () => {
    if (!jsonText.trim()) {
      alert('JSON 코드를 입력해주세요.');
      return;
    }

    try {
      const jsonData = JSON.parse(jsonText);
      await handleImport(jsonData);
    } catch (error: any) {
      alert(`JSON 파싱 오류: ${error.message}\n올바른 JSON 형식인지 확인해주세요.`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="h-4 w-4" />
          Import Data
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>데이터 가져오기</DialogTitle>
          <DialogDescription>
            분석된 산업 데이터를 JSON 형식으로 가져옵니다. 파일 업로드 또는 코드 붙여넣기를 선택할 수 있습니다.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="flex items-center gap-2 p-1 bg-muted rounded-md w-fit">
            <Button 
              variant={importMode === 'file' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setImportMode('file')}
              className="gap-2"
            >
              <FileJson className="h-4 w-4" />
              파일 업로드
            </Button>
            <Button 
              variant={importMode === 'text' ? 'secondary' : 'ghost'} 
              size="sm"
              onClick={() => setImportMode('text')}
              className="gap-2"
            >
              <ClipboardPaste className="h-4 w-4" />
              코드 붙여넣기
            </Button>
          </div>

          {importMode === 'file' ? (
            <div className="grid w-full items-center gap-1.5 border-2 border-dashed rounded-lg p-10 text-center">
              <input
                type="file"
                ref={fileInputRef}
                accept=".json"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="flex flex-col items-center gap-2">
                <div className="p-3 bg-primary/10 rounded-full text-primary">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-medium">분석 결과 JSON 파일을 선택하세요</p>
                  <p className="text-xs text-muted-foreground mt-1">지원 형식: .json</p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="mt-2"
                >
                  {isProcessing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  파일 선택
                </Button>
              </div>
            </div>
          ) : (
            <div className="grid w-full gap-1.5">
              <Label htmlFor="json-input">JSON 코드</Label>
              <Textarea
                id="json-input"
                placeholder='{ "industry_id": 1, "leads": [...] }'
                className="min-h-[300px] font-mono text-xs"
                value={jsonText}
                onChange={(e) => setJsonText(e.target.value)}
                disabled={isProcessing}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          {importMode === 'text' && (
            <Button 
              onClick={handleTextImport} 
              disabled={isProcessing || !jsonText.trim()}
              className="w-full sm:w-auto"
            >
              {isProcessing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              데이터 가져오기
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
