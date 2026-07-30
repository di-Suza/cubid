import { type FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CalendarClock, CirclePlay, ImagePlus, Save } from 'lucide-react';

import { Button, Input } from '../../../../shared/ui';
import { getErrorMessage } from '../../../../shared/utils';
import { useCreateAuctionMutation } from '../../api/auction.api';
import './AuctionMarketplacePages.css';

const toMinor = (value: string): number | null => {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount < 0) {
    return null;
  }

  return Math.round(amount * 100);
};

const toIsoFromLocalInput = (value: string): string | undefined => {
  if (!value) {
    return undefined;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

export const CreateAuctionPage = () => {
  const navigate = useNavigate();
  const [createAuction, { isLoading }] = useCreateAuctionMutation();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageDataUrl, setImageDataUrl] = useState('');
  const [imageFileName, setImageFileName] = useState('');
  const [startingBid, setStartingBid] = useState('');
  const [minimumIncrement, setMinimumIncrement] = useState('100');
  const [durationMinutes, setDurationMinutes] = useState('60');
  const [startMode, setStartMode] = useState<'now' | 'scheduled'>('now');
  const [startAt, setStartAt] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleImageUpload = (file: File | undefined) => {
    if (!file) {
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFormError('Upload a JPEG, PNG, or WEBP image.');
      return;
    }

    if (file.size > 2_000_000) {
      setFormError('Image must be 2 MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImageDataUrl(String(reader.result));
      setImageFileName(file.name);
      setImageUrl('');
      setFormError(null);
    };
    reader.onerror = () => {
      setFormError('Unable to read the selected image.');
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);

    const startingBidMinor = toMinor(startingBid);
    const minimumIncrementMinor = toMinor(minimumIncrement);
    const durationSeconds = Math.round(Number(durationMinutes) * 60);

    if (startingBidMinor === null || minimumIncrementMinor === null || minimumIncrementMinor <= 0) {
      setFormError('Enter valid bid and increment amounts.');
      return;
    }

    if (!Number.isSafeInteger(durationSeconds) || durationSeconds < 10) {
      setFormError('Duration must be at least 10 seconds.');
      return;
    }

    if (!imageDataUrl && !imageUrl.trim()) {
      setFormError('Upload a product image before creating the auction.');
      return;
    }

    try {
      const auction = await createAuction({
        title,
        description,
        imageDataUrl: imageDataUrl || undefined,
        imageUrl: imageDataUrl ? undefined : imageUrl,
        currency: 'INR',
        startingBidMinor,
        minimumIncrementMinor,
        durationSeconds,
        startAt: startMode === 'scheduled' ? toIsoFromLocalInput(startAt) : undefined
      }).unwrap();

      navigate(`/auctions/${auction.id}`);
    } catch (error) {
      setFormError(getErrorMessage(error, 'Unable to create auction'));
    }
  };

  return (
    <section className="market-page market-page--narrow">
      <header className="market-page__header">
        <div>
          <p className="eyebrow">Seller</p>
          <h1>Create auction</h1>
        </div>
      </header>

      <form className="market-form market-form--create" onSubmit={handleSubmit}>
        <div className="market-form__main">
          <Input
            label="Title"
            maxLength={140}
            name="title"
            onChange={(event) => setTitle(event.target.value)}
            required
            value={title}
          />

          <label className="market-form__field" htmlFor="description">
            <span>Description</span>
            <textarea
              id="description"
              maxLength={5000}
              name="description"
              onChange={(event) => setDescription(event.target.value)}
              required
              rows={6}
              value={description}
            />
          </label>

          <div className="market-form__grid market-form__grid--three">
            <Input
              label="Starting bid"
              min="0"
              name="startingBid"
              onChange={(event) => setStartingBid(event.target.value)}
              required
              step="0.01"
              type="number"
              value={startingBid}
            />
            <Input
              label="Minimum increment"
              min="0.01"
              name="minimumIncrement"
              onChange={(event) => setMinimumIncrement(event.target.value)}
              required
              step="0.01"
              type="number"
              value={minimumIncrement}
            />
            <Input
              label="Duration minutes"
              min="1"
              name="durationMinutes"
              onChange={(event) => setDurationMinutes(event.target.value)}
              required
              step="1"
              type="number"
              value={durationMinutes}
            />
          </div>

          <div className="market-form__schedule">
            <div className="segmented-control" aria-label="Auction start time">
              <button
                aria-pressed={startMode === 'now'}
                onClick={() => setStartMode('now')}
                type="button"
              >
                <CirclePlay size={16} />
                Start now
              </button>
              <button
                aria-pressed={startMode === 'scheduled'}
                onClick={() => setStartMode('scheduled')}
                type="button"
              >
                <CalendarClock size={16} />
                Schedule
              </button>
            </div>

            {startMode === 'scheduled' ? (
              <Input
                label="Start at"
                name="startAt"
                onChange={(event) => setStartAt(event.target.value)}
                required
                type="datetime-local"
                value={startAt}
              />
            ) : null}
          </div>

          {formError ? <p className="market-form__error">{formError}</p> : null}

          <div className="market-form__actions">
            <Button disabled={isLoading} icon={<Save size={16} />} type="submit">
              {isLoading ? 'Creating' : 'Create auction'}
            </Button>
          </div>
        </div>

        <aside className="market-form__media" aria-label="Product media">
          <label className="market-upload market-upload--preview" htmlFor="auctionImage">
            <input
              accept="image/jpeg,image/png,image/webp"
              id="auctionImage"
              name="auctionImage"
              onChange={(event) => handleImageUpload(event.target.files?.[0])}
              type="file"
            />
            {imageDataUrl ? (
              <img alt="Auction upload preview" src={imageDataUrl} />
            ) : (
              <span>
                <ImagePlus size={28} />
                Product image
              </span>
            )}
          </label>
          <div className="market-upload__meta">
            <strong>{imageFileName || 'Upload a product photo'}</strong>
            <span>JPEG, PNG, or WEBP up to 2 MB</span>
          </div>
          <Input
            label="Image URL fallback"
            name="imageUrl"
            onChange={(event) => {
              setImageUrl(event.target.value);
              if (event.target.value.trim()) {
                setImageDataUrl('');
                setImageFileName('');
              }
            }}
            type="url"
            value={imageUrl}
          />
        </aside>
      </form>
    </section>
  );
};
