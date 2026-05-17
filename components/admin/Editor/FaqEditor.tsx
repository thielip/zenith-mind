"use client";

export interface FaqItemInput {
  question: string;
  answer: string;
  questionEn?: string;
  answerEn?: string;
}

interface Props {
  value: FaqItemInput[];
  onChange: (next: FaqItemInput[]) => void;
}

export default function FaqEditor({ value, onChange }: Props) {
  function updateItem(index: number, patch: Partial<FaqItemInput>) {
    const next = [...value];
    const current = next[index] ?? { question: "", answer: "", questionEn: "", answerEn: "" };
    next[index] = { ...current, ...patch };
    onChange(next);
  }

  function addItem() {
    onChange([
      ...value,
      { question: "", answer: "", questionEn: "", answerEn: "" },
    ]);
  }

  function removeItem(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-gray-900">FAQ 編輯</h3>
        <button
          type="button"
          onClick={addItem}
          className="rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
        >
          + 新增 FAQ
        </button>
      </div>

      {value.length === 0 && (
        <p className="rounded-lg border border-dashed border-gray-300 p-4 text-sm text-gray-500">
          尚未建立 FAQ，點擊「新增 FAQ」開始。
        </p>
      )}

      {value.map((item, index) => (
        <div key={index} className="space-y-3 rounded-xl border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-700">FAQ #{index + 1}</p>
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="text-xs text-red-600 hover:text-red-700"
            >
              刪除
            </button>
          </div>

          <div>
            <label htmlFor={`faq-q-${index}`} className="mb-1 block text-xs font-medium text-gray-600">問題（繁中）</label>
            <input
              id={`faq-q-${index}`}
              value={item.question}
              onChange={(e) => updateItem(index, { question: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor={`faq-a-${index}`} className="mb-1 block text-xs font-medium text-gray-600">答案（繁中）</label>
            <textarea
              id={`faq-a-${index}`}
              rows={4}
              value={item.answer}
              onChange={(e) => updateItem(index, { answer: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor={`faq-qen-${index}`} className="mb-1 block text-xs font-medium text-gray-600">問題（英文，選填）</label>
            <input
              id={`faq-qen-${index}`}
              value={item.questionEn ?? ""}
              onChange={(e) => updateItem(index, { questionEn: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor={`faq-aen-${index}`} className="mb-1 block text-xs font-medium text-gray-600">答案（英文，選填）</label>
            <textarea
              id={`faq-aen-${index}`}
              rows={3}
              value={item.answerEn ?? ""}
              onChange={(e) => updateItem(index, { answerEn: e.target.value })}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
        </div>
      ))}
    </div>
  );
}
