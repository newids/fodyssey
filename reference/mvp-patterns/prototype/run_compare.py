#!/usr/bin/env python3
"""적응형 프롬프트 비교 프로토타입 (MVP W1).

동일한 사기문자를 두 프로파일(senior/youth)로 판별시켜 출력을 나란히 비교한다.
데모 시나리오(docs/idea-1/데모_시나리오_v0.1.md)의 P2 증명 장면을 화면 없이 검증하는 용도.

사용법:
    export ANTHROPIC_API_KEY=...
    python3 run_compare.py --item S01          # 데이터셋 문항으로 비교
    python3 run_compare.py --item S01 --save   # outputs/에 결과 저장
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
DATASET = ROOT.parent / "data" / "scam_dataset_v0.1.json"
PROMPT_FILE = ROOT / "adaptive_system_prompt.md"
PROFILES_FILE = ROOT / "profiles.json"
OUTPUT_DIR = ROOT / "outputs"
MODEL = "claude-sonnet-5"
MAX_TOKENS = 1000


def load_template() -> str:
    text = PROMPT_FILE.read_text(encoding="utf-8")
    match = re.search(r"## TEMPLATE\n(.*?)\n## ", text, re.DOTALL)
    if not match:
        sys.exit("adaptive_system_prompt.md에서 TEMPLATE 블록을 찾지 못했습니다.")
    return match.group(1).strip()


def build_system_prompt(template: str, profile: dict) -> str:
    filled = template
    for key in ("literacy_level", "format", "large_text", "pace"):
        filled = filled.replace("{" + key + "}", str(profile[key]))
    return filled


def find_item(item_id: str) -> dict:
    data = json.loads(DATASET.read_text(encoding="utf-8"))
    for item in data["items"]:
        if item["id"] == item_id:
            return item
    sys.exit(f"데이터셋에 {item_id} 문항이 없습니다.")


def call_model(client, system_prompt: str, body: str) -> str:
    response = client.messages.create(
        model=MODEL,
        max_tokens=MAX_TOKENS,
        system=system_prompt,
        messages=[{"role": "user", "content": f'다음 문자를 판별해 줘:\n\n"""\n{body}\n"""'}],
    )
    return response.content[0].text


def main() -> None:
    parser = argparse.ArgumentParser(description="적응형 프롬프트 프로파일 비교")
    parser.add_argument("--item", default="S01", help="데이터셋 문항 id (기본 S01)")
    parser.add_argument("--save", action="store_true", help="outputs/에 결과 저장")
    args = parser.parse_args()

    if not os.environ.get("ANTHROPIC_API_KEY"):
        sys.exit(
            "ANTHROPIC_API_KEY가 설정되지 않았습니다.\n"
            "실행 전: export ANTHROPIC_API_KEY=<키>\n"
            "기대 출력 예시는 golden/ 폴더를 참고하세요."
        )

    import anthropic

    client = anthropic.Anthropic()
    template = load_template()
    profiles = json.loads(PROFILES_FILE.read_text(encoding="utf-8"))
    item = find_item(args.item)

    print(f"=== 입력 문자 ({item['id']} · {item['type']} · 난이도 {item['difficulty']}) ===")
    print(item["body"])

    results = {}
    for name, profile in profiles.items():
        system_prompt = build_system_prompt(template, profile)
        output = call_model(client, system_prompt, item["body"])
        results[name] = output
        print(f"\n=== {profile['label']} ===")
        print(output)

    if args.save:
        OUTPUT_DIR.mkdir(exist_ok=True)
        for name, output in results.items():
            path = OUTPUT_DIR / f"{item['id']}_{name}.md"
            path.write_text(output, encoding="utf-8")
        print(f"\n저장 완료: {OUTPUT_DIR}/{item['id']}_*.md")


if __name__ == "__main__":
    main()
