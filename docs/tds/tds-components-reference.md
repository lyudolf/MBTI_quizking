# TDS Components Reference

> 앱인토스 미니앱 개발 핵심 TDS 컴포넌트 11개 레퍼런스.
> Import: `@toss/tds-mobile` (앱인토스 템플릿 기본 설치)

## 1. Badge
```tsx
import { Badge } from "@toss/tds-mobile";
<Badge size="small" color="blue" variant="fill">상태값</Badge>
```
Props: size(xsmall/small/medium/large), variant(fill/weak), color(blue/teal/green/red/...)

## 2. Border
```tsx
import { Border } from "@toss/tds-mobile";
<Border variant="full" />
```

## 3. BottomCTA
```tsx
import { BottomCTA } from "@toss/tds-mobile";
<BottomCTA.Single hasSafeAreaPadding>
  <Button size="xlarge" variant="fill" color="primary">확인</Button>
</BottomCTA.Single>
```

## 4. Button
```tsx
import { Button } from "@toss/tds-mobile";
<Button size="large" variant="fill" color="primary">다음</Button>
```
Props: size(small/medium/large/xlarge), variant(fill/weak), color(primary/danger/light/dark), disabled, loading

## 5. Asset
```tsx
import { Asset } from "@toss/tds-mobile";
<Asset.Icon color="green" name="heart-line" />
<Asset.Image frameShape={{ width: 160 }} src="url" />
```

## 6. ListRow
```tsx
import { ListRow } from "@toss/tds-mobile";
<ListRow
  left={<ListRow.Icon name="icon-notification" />}
  contents={<ListRow.Texts texts={[{ text: '알림 설정' }]} />}
  withArrow
  onPress={() => {}}
/>
```

## 7. ListHeader
```tsx
import { ListHeader } from "@toss/tds-mobile";
<ListHeader
  title={<ListHeader.TitleParagraph typography="t5" fontWeight="bold">제목</ListHeader.TitleParagraph>}
/>
```

## 8. Top (Navigation/Header)
```tsx
import { Top } from "@toss/tds-mobile";
<Top
  title={<Top.TitleParagraph size={22}>제목</Top.TitleParagraph>}
  subtitleBottom={<Top.SubtitleParagraph size={17}>부제</Top.SubtitleParagraph>}
/>
```

## 9. Paragraph
```tsx
import { Paragraph } from "@toss/tds-mobile";
<Paragraph typography="t5">
  <Paragraph.Text>텍스트</Paragraph.Text>
</Paragraph>
```

## 10. Tab
```tsx
import { Tab } from "@toss/tds-mobile";
<Tab size="large" onChange={(i) => setIndex(i)}>
  <Tab.Item selected={index === 0}>탭1</Tab.Item>
  <Tab.Item selected={index === 1}>탭2</Tab.Item>
</Tab>
```

## 11. TextField
```tsx
import { TextField } from "@toss/tds-mobile";
<TextField.Clearable variant="line" label="닉네임" placeholder="2~8자" />
```
